create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;
revoke all on public.game_saves from anon;
grant select, insert, update, delete on public.game_saves to authenticated;

drop policy if exists "Players read only their save" on public.game_saves;
create policy "Players read only their save" on public.game_saves
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Players create only their save" on public.game_saves;
create policy "Players create only their save" on public.game_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Players update only their save" on public.game_saves;
create policy "Players update only their save" on public.game_saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Players delete only their save" on public.game_saves;
create policy "Players delete only their save" on public.game_saves
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Public trading identity. Email and password data remain exclusively in auth.users.
create table if not exists public.player_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_-]{3,20}$'),
  money bigint not null default 0 check (money >= 0),
  is_admin boolean not null default false,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.player_profiles add column if not exists last_seen timestamptz not null default now();

create table if not exists public.player_inventory (
  owner_id uuid not null references public.player_profiles(user_id) on delete cascade,
  weapon_id text not null,
  level integer not null default 1 check (level >= 1),
  acquired_at timestamptz not null default now(),
  primary key (owner_id, weapon_id),
  check (weapon_id not in ('weedwacker-9000', 'apples', 'ordinance-undefined'))
);
create table if not exists public.player_weapon_claims (
  owner_id uuid not null references public.player_profiles(user_id) on delete cascade,
  weapon_id text not null,
  primary key(owner_id,weapon_id)
);

create table if not exists public.trade_offers (
  id bigint generated always as identity primary key,
  proposer_id uuid not null references public.player_profiles(user_id) on delete cascade,
  recipient_id uuid not null references public.player_profiles(user_id) on delete cascade,
  offered_money bigint not null default 0 check (offered_money >= 0),
  requested_money bigint not null default 0 check (requested_money >= 0),
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  check (proposer_id <> recipient_id)
);

create table if not exists public.trade_offer_items (
  offer_id bigint not null references public.trade_offers(id) on delete cascade,
  side text not null check (side in ('offered','requested')),
  weapon_id text not null,
  primary key (offer_id, side, weapon_id),
  check (weapon_id not in ('weedwacker-9000', 'apples', 'ordinance-undefined'))
);

create table if not exists public.weapon_trade_history (
  id bigint generated always as identity primary key,
  offer_id bigint not null references public.trade_offers(id),
  weapon_id text not null,
  implied_value bigint not null check (implied_value >= 0),
  traded_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;
alter table public.player_inventory enable row level security;
alter table public.player_weapon_claims enable row level security;
alter table public.trade_offers enable row level security;
alter table public.trade_offer_items enable row level security;
alter table public.weapon_trade_history enable row level security;

grant select on public.player_profiles, public.player_inventory, public.weapon_trade_history to authenticated;
grant select on public.trade_offers, public.trade_offer_items to authenticated;
revoke insert, update, delete on public.player_profiles, public.player_inventory, public.trade_offers, public.trade_offer_items, public.weapon_trade_history from authenticated, anon;
revoke all on public.player_weapon_claims from authenticated, anon;

drop policy if exists "Public signed-in profiles" on public.player_profiles;
create policy "Public signed-in profiles" on public.player_profiles for select to authenticated using (true);
drop policy if exists "Public signed-in inventories" on public.player_inventory;
create policy "Public signed-in inventories" on public.player_inventory for select to authenticated using (true);
drop policy if exists "Trade participants view offers" on public.trade_offers;
create policy "Trade participants view offers" on public.trade_offers for select to authenticated
  using ((select auth.uid()) in (proposer_id, recipient_id));
drop policy if exists "Trade participants view items" on public.trade_offer_items;
create policy "Trade participants view items" on public.trade_offer_items for select to authenticated
  using (exists (select 1 from public.trade_offers o where o.id = offer_id and (select auth.uid()) in (o.proposer_id, o.recipient_id)));
drop policy if exists "Public trade history" on public.weapon_trade_history;
create policy "Public trade history" on public.weapon_trade_history for select to authenticated using (true);

create or replace function public.register_market_profile(p_username text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_username !~ '^[A-Za-z0-9_-]{3,20}$' then raise exception 'Invalid username'; end if;
  insert into player_profiles(user_id, username) values (auth.uid(), p_username)
  on conflict (user_id) do update set username = excluded.username, last_seen = now();
end $$;

create or replace function public.sync_market_inventory(p_weapons text[], p_levels jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare w text; claimed boolean;
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  foreach w in array coalesce(p_weapons,'{}') loop
    if w in ('weedwacker-9000','apples','ordinance-undefined') then continue; end if;
    insert into player_weapon_claims(owner_id,weapon_id) values(auth.uid(),w) on conflict do nothing returning true into claimed;
    if claimed then
      insert into player_inventory(owner_id,weapon_id,level) values(auth.uid(),w,greatest(1,least(99,coalesce((p_levels->>w)::integer,1)))) on conflict do nothing;
    end if;
    claimed := false;
  end loop;
end $$;

create or replace function public.create_trade_offer(p_recipient uuid, p_offered text[], p_requested text[], p_offered_money bigint default 0, p_requested_money bigint default 0)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  if auth.uid() is null or auth.uid() = p_recipient then raise exception 'Invalid participants'; end if;
  if p_offered_money < 0 or p_requested_money < 0 then raise exception 'Invalid Money amount'; end if;
  if array_length(p_offered,1) is null and p_offered_money = 0 then raise exception 'Offer cannot be empty'; end if;
  if exists (select 1 from unnest(p_offered) w where w in ('weedwacker-9000','apples','ordinance-undefined')) then raise exception 'Untradeable weapon'; end if;
  if exists (select 1 from unnest(p_requested) w where w in ('weedwacker-9000','apples','ordinance-undefined')) then raise exception 'Untradeable weapon'; end if;
  if (select money from player_profiles where user_id = auth.uid()) < p_offered_money then raise exception 'Insufficient Money'; end if;
  if exists (select 1 from unnest(p_offered) w where not exists (select 1 from player_inventory i where i.owner_id=auth.uid() and i.weapon_id=w)) then raise exception 'Weapon not owned'; end if;
  if exists (select 1 from unnest(p_requested) w where not exists (select 1 from player_inventory i where i.owner_id=p_recipient and i.weapon_id=w)) then raise exception 'Requested weapon not owned'; end if;
  if exists (select 1 from unnest(p_offered) w where exists (select 1 from player_inventory i where i.owner_id=p_recipient and i.weapon_id=w)) then raise exception 'Recipient already owns offered weapon'; end if;
  if exists (select 1 from unnest(p_requested) w where exists (select 1 from player_inventory i where i.owner_id=auth.uid() and i.weapon_id=w)) then raise exception 'Proposer already owns requested weapon'; end if;
  insert into trade_offers(proposer_id,recipient_id,offered_money,requested_money)
    values(auth.uid(),p_recipient,p_offered_money,p_requested_money) returning id into v_id;
  insert into trade_offer_items select v_id,'offered',w from unnest(coalesce(p_offered,'{}')) w;
  insert into trade_offer_items select v_id,'requested',w from unnest(coalesce(p_requested,'{}')) w;
  return v_id;
end $$;

create or replace function public.accept_trade_offer(p_offer_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare o trade_offers%rowtype; w text;
begin
  select * into o from trade_offers where id=p_offer_id for update;
  if o.status <> 'pending' or o.recipient_id <> auth.uid() then raise exception 'Offer unavailable'; end if;
  perform 1 from player_profiles where user_id in (o.proposer_id,o.recipient_id) for update;
  if (select money from player_profiles where user_id=o.proposer_id) < o.offered_money or (select money from player_profiles where user_id=o.recipient_id) < o.requested_money then raise exception 'Insufficient Money'; end if;
  if exists(select 1 from trade_offer_items x where x.offer_id=o.id and x.side='offered' and not exists(select 1 from player_inventory i where i.owner_id=o.proposer_id and i.weapon_id=x.weapon_id)) then raise exception 'Offer ownership changed'; end if;
  if exists(select 1 from trade_offer_items x where x.offer_id=o.id and x.side='requested' and not exists(select 1 from player_inventory i where i.owner_id=o.recipient_id and i.weapon_id=x.weapon_id)) then raise exception 'Request ownership changed'; end if;
  update player_profiles set money=money-o.offered_money+o.requested_money where user_id=o.proposer_id;
  update player_profiles set money=money-o.requested_money+o.offered_money where user_id=o.recipient_id;
  for w in select weapon_id from trade_offer_items where offer_id=o.id and side='offered' loop update player_inventory set owner_id=o.recipient_id where owner_id=o.proposer_id and weapon_id=w; end loop;
  for w in select weapon_id from trade_offer_items where offer_id=o.id and side='requested' loop update player_inventory set owner_id=o.proposer_id where owner_id=o.recipient_id and weapon_id=w; end loop;
  insert into weapon_trade_history(offer_id,weapon_id,implied_value)
    select o.id, x.weapon_id,
      case when (select count(*) from trade_offer_items where offer_id=o.id) = 0 then 0
      else ((o.offered_money + o.requested_money) / (select count(*) from trade_offer_items where offer_id=o.id)) end
    from trade_offer_items x where x.offer_id=o.id;
  update trade_offers set status='accepted',resolved_at=now() where id=o.id;
end $$;

create or replace function public.admin_giveaway(p_recipient uuid, p_weapon_id text default null, p_money bigint default 0)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists(select 1 from player_profiles where user_id=auth.uid() and is_admin) then raise exception 'Admin only'; end if;
  if p_money < 0 then raise exception 'Invalid Money'; end if;
  update player_profiles set money=money+p_money where user_id=p_recipient;
  if p_weapon_id is not null and p_weapon_id not in ('weedwacker-9000','apples','ordinance-undefined') then
    insert into player_inventory(owner_id,weapon_id) values(p_recipient,p_weapon_id) on conflict do nothing;
  end if;
end $$;

grant execute on function public.register_market_profile(text), public.sync_market_inventory(text[],jsonb), public.create_trade_offer(uuid,text[],text[],bigint,bigint), public.accept_trade_offer(bigint), public.admin_giveaway(uuid,text,bigint) to authenticated;
