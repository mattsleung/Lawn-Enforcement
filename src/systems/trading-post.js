import { WEAPON_DEFINITIONS, weaponById, weaponStatsAtLevel } from "../config/weapons.js";
import { renderHeldWeaponVisual } from "../entities/held-weapon.js";
import { estimateWeaponValue, formatMoney, UNTRADEABLE_WEAPONS } from "./weapon-value.js";

const SAFE_SCREENS = new Set(["menu", "shop", "quests", "season-shop", "permanent-upgrades", "settings", "glossary"]);

export class TradingPostClient {
  constructor(cloud, game) {
    this.cloud = cloud; this.game = game; this.data = null; this.selectedRecipient = null;
    this.modal = document.querySelector("#trading-modal"); this.content = document.querySelector("#trading-content"); this.status = document.querySelector("#trading-status");
    this.profileModal = document.querySelector("#player-profile-modal"); this.profileContent = document.querySelector("#player-profile-content");
    document.querySelector("#trading-button")?.addEventListener("click", () => this.open());
    document.querySelector("#trading-close")?.addEventListener("click", () => this.modal?.close());
    document.querySelector("#player-profile-close")?.addEventListener("click", () => this.profileModal?.close());
    window.setInterval(() => this.updateButtonVisibility(), 120); this.updateButtonVisibility();
  }

  updateButtonVisibility() {
    const visible = SAFE_SCREENS.has(this.game?.screenState);
    for (const id of ["account-button", "trading-button"]) document.querySelector(`#${id}`)?.toggleAttribute("hidden", !visible);
    if (!visible) { if (this.modal?.open) this.modal.close(); if (this.profileModal?.open) this.profileModal.close(); }
  }
  async open() {
    if (!SAFE_SCREENS.has(this.game?.screenState)) return;
    this.modal?.showModal();
    if (!this.cloud.session?.user) return this.setStatus("Sign in to use the Trading Post.", true);
    this.setStatus("Loading market…");
    try { await this.renderMarket(); } catch (error) { this.setStatus(error.message, true); }
  }
  async loadMarket() {
    const token = this.cloud.session.access_token;
    const [profiles, inventory, history, offers, offerItems] = await Promise.all([
      this.cloud.request("/rest/v1/player_profiles?select=user_id,username,money,is_admin,last_seen", { token }),
      this.cloud.request("/rest/v1/player_inventory?select=owner_id,weapon_id,level,acquired_at", { token }),
      this.cloud.request("/rest/v1/weapon_trade_history?select=weapon_id,implied_value,traded_at", { token }),
      this.cloud.request("/rest/v1/trade_offers?select=id,proposer_id,recipient_id,offered_money,requested_money,status,created_at&status=eq.pending", { token }),
      this.cloud.request("/rest/v1/trade_offer_items?select=offer_id,side,weapon_id", { token }),
    ]);
    const market = buildMarketMetrics(inventory, history);
    const ranked = profiles.map((profile) => {
      const weapons = inventory.filter((item) => item.owner_id === profile.user_id);
      return { ...profile, weapons, worth: weapons.reduce((sum, item) => sum + estimateWeaponValue(item.weapon_id, market[item.weapon_id]), 0) };
    }).sort((a, b) => b.worth - a.worth);
    return this.data = { profiles: ranked, market, offers, offerItems };
  }
  async renderMarket() {
    const { profiles, market, offers, offerItems } = await this.loadMarket();
    const me = profiles.find((profile) => profile.user_id === this.cloud.session.user.id);
    const online = profiles.filter((profile) => profile.user_id !== me?.user_id && Date.now() - Date.parse(profile.last_seen) < 300000);
    const recipientOptions = online.map((p) => `<option value="${p.user_id}">${escapeHtml(p.username)}</option>`).join("");
    this.content.innerHTML = `
      <section><h3>TOP 10 BY WEAPON WORTH</h3>${profiles.slice(0, 10).map((p, i) => profileRow(p, i + 1)).join("") || "<p>No public profiles yet.</p>"}</section>
      <section><h3>ONLINE PLAYERS</h3>${online.map((p) => profileRow(p)).join("") || "<p>No other players online.</p>"}</section>
      <section><h3>FIND ANY PLAYER</h3><label>USERNAME<input id="player-search" placeholder="Exact username" maxlength="20"></label><button id="player-search-button">OPEN PROFILE</button></section>
      <section><h3>PENDING OFFERS</h3>${offers.map((o) => offerRow(o, offerItems, profiles, me)).join("") || "<p>No pending offers.</p>"}</section>
      <section class="trade-builder"><h3>CREATE TRADE REQUEST</h3>
        <label>ONLINE PLAYER<select id="trade-recipient-online"><option value="">Choose online player…</option>${recipientOptions}</select></label>
        <label>OR ANY USERNAME<input id="trade-recipient-search" placeholder="Exact username" maxlength="20"></label><button id="trade-find-player">LOAD PLAYER</button>
        <p id="trade-selected-player">No player selected.</p>
        <label>YOUR WEAPONS (OPTIONAL)<select id="trade-offered" multiple>${weaponOptions(me?.weapons ?? [])}</select></label>
        <label>THEIR WEAPONS (OPTIONAL)<select id="trade-requested" multiple></select></label>
        <label>MONEY YOU GIVE (OPTIONAL)<input id="trade-offered-money" type="number" min="0" placeholder="$0"></label>
        <label>MONEY YOU REQUEST (OPTIONAL)<input id="trade-requested-money" type="number" min="0" placeholder="$0"></label>
        <button id="trade-create">SEND OFFER</button><small>Limit: one request per minute and 15 per hour.</small></section>
      ${me?.is_admin ? `<section><h3>ADMIN GIVEAWAY</h3><label>PLAYER<select id="giveaway-recipient"><option value="">Choose player…</option>${profiles.filter((p) => p.user_id !== me.user_id).map((p) => `<option value="${p.user_id}">${escapeHtml(p.username)}</option>`).join("")}</select></label><label>WEAPON (OPTIONAL)<select id="giveaway-weapon"><option value="">No weapon</option>${allWeaponOptions()}</select></label><label>MONEY (OPTIONAL)<input id="giveaway-money" type="number" min="0" placeholder="$0"></label><button id="giveaway-send">GIVE</button><small>Limit: one giveaway per minute and 15 per hour.</small></section>` : ""}`;
    this.bindMarketEvents(); this.setStatus(`Money ${formatMoney(me?.money)} · Weapon worth ${formatMoney(me?.worth)}`);
  }
  bindMarketEvents() {
    this.content.querySelectorAll("[data-profile]").forEach((button) => button.addEventListener("click", () => this.openProfile(button.dataset.profile)));
    this.content.querySelectorAll("[data-accept]").forEach((button) => button.addEventListener("click", () => this.acceptOffer(Number(button.dataset.accept))));
    this.content.querySelector("#player-search-button")?.addEventListener("click", () => this.openProfileByUsername(this.content.querySelector("#player-search").value));
    this.content.querySelector("#trade-recipient-online")?.addEventListener("change", (event) => this.selectTradeRecipient(event.target.value));
    this.content.querySelector("#trade-find-player")?.addEventListener("click", () => this.selectTradeRecipientByUsername(this.content.querySelector("#trade-recipient-search").value));
    this.content.querySelector("#trade-create")?.addEventListener("click", () => this.createOffer());
    this.content.querySelector("#giveaway-send")?.addEventListener("click", () => this.giveaway());
  }
  openProfileByUsername(username) { const profile = this.findProfile(username); if (!profile) return this.setStatus("No player has that username.", true); this.openProfile(profile.user_id); }
  openProfile(userId) {
    const profile = this.data?.profiles.find((item) => item.user_id === userId); if (!profile) return;
    this.profileContent.innerHTML = `<header class="profile-header"><div><p>PLAYER PROFILE</p><h2>${escapeHtml(profile.username)}</h2></div><strong>${formatMoney(profile.worth)} WEAPON WORTH</strong></header><p>Click any weapon for its full playable preview.</p><div class="profile-weapon-grid">${profile.weapons.map((item) => weaponCard(item, this.data.market)).join("") || "<p>This player has no tradable weapons.</p>"}</div>`;
    this.profileContent.querySelectorAll("[data-weapon]").forEach((button) => button.addEventListener("click", () => { this.profileModal.close(); this.modal.close(); this.game.openWeaponPreview(button.dataset.weapon, "menu"); }));
    drawWeaponCanvases(this.profileContent); this.profileModal.showModal();
  }
  findProfile(username) { return this.data?.profiles.find((p) => p.username.toLowerCase() === username.trim().toLowerCase()); }
  selectTradeRecipientByUsername(username) { const profile = this.findProfile(username); if (!profile) return this.setStatus("No player has that username.", true); this.selectTradeRecipient(profile.user_id); }
  selectTradeRecipient(userId) {
    const profile = this.data?.profiles.find((item) => item.user_id === userId);
    if (!profile || profile.user_id === this.cloud.session.user.id) return this.setStatus("Choose another player.", true);
    this.selectedRecipient = profile.user_id; this.content.querySelector("#trade-selected-player").textContent = `Trading with ${profile.username}`;
    this.content.querySelector("#trade-requested").innerHTML = weaponOptions(profile.weapons);
  }
  async rpc(name, body) { return this.cloud.request(`/rest/v1/rpc/${name}`, { method: "POST", body, token: this.cloud.session.access_token }); }
  async acceptOffer(id) { try { await this.rpc("accept_trade_offer", { p_offer_id: id }); await this.renderMarket(); } catch (error) { this.setStatus(error.message, true); } }
  async createOffer() {
    if (!this.selectedRecipient) return this.setStatus("Choose an online player or search a username first.", true);
    const selected = (id) => [...this.content.querySelector(id).selectedOptions].map((option) => option.value);
    try { await this.rpc("create_trade_offer", { p_recipient: this.selectedRecipient, p_offered: selected("#trade-offered"), p_requested: selected("#trade-requested"), p_offered_money: Number(this.content.querySelector("#trade-offered-money").value) || 0, p_requested_money: Number(this.content.querySelector("#trade-requested-money").value) || 0 }); await this.renderMarket(); }
    catch (error) { this.setStatus(error.message, true); }
  }
  async giveaway() { try { await this.rpc("admin_giveaway", { p_recipient: this.content.querySelector("#giveaway-recipient").value, p_weapon_id: this.content.querySelector("#giveaway-weapon").value || null, p_money: Number(this.content.querySelector("#giveaway-money").value) || 0 }); await this.renderMarket(); } catch (error) { this.setStatus(error.message, true); } }
  setStatus(text, error = false) { this.status.textContent = text; this.status.classList.toggle("is-error", error); }
}

export function buildMarketMetrics(inventory, history) {
  const result = {};
  for (const item of inventory) (result[item.weapon_id] ??= { circulation: 0, tradeCount: 0, tradeTotal: 0 }).circulation += 1;
  for (const trade of history) { const metric = result[trade.weapon_id] ??= { circulation: 0, tradeCount: 0, tradeTotal: 0 }; metric.tradeCount += 1; metric.tradeTotal += Number(trade.implied_value) || 0; }
  for (const metric of Object.values(result)) metric.averageTradePrice = metric.tradeCount ? metric.tradeTotal / metric.tradeCount : 0;
  return result;
}
function profileRow(profile, rank = null) { return `<button class="market-card player-card" data-profile="${profile.user_id}">${rank ? `#${rank} ` : ""}${escapeHtml(profile.username)}<span>${formatMoney(profile.worth)}</span></button>`; }
function weaponOptions(items) { return items.filter((item) => !UNTRADEABLE_WEAPONS.has(item.weapon_id)).map((item) => `<option value="${item.weapon_id}">${escapeHtml(weaponById(item.weapon_id)?.name ?? item.weapon_id)} · LV ${item.level}</option>`).join(""); }
function allWeaponOptions() { return WEAPON_DEFINITIONS.filter((w) => !UNTRADEABLE_WEAPONS.has(w.id) && !w.developerOnly).map((w) => `<option value="${w.id}">${escapeHtml(w.name)}</option>`).join(""); }
function offerRow(offer, items, profiles, me) {
  const username = (id) => profiles.find((p) => p.user_id === id)?.username ?? "Unknown";
  const names = (side) => items.filter((item) => item.offer_id === offer.id && item.side === side).map((item) => weaponById(item.weapon_id)?.name ?? item.weapon_id).join(", ") || "no weapons";
  return `<div class="market-card"><b>${escapeHtml(username(offer.proposer_id))} → ${escapeHtml(username(offer.recipient_id))}</b><p>Gives: ${escapeHtml(names("offered"))} + ${formatMoney(offer.offered_money)}</p><p>Requests: ${escapeHtml(names("requested"))} + ${formatMoney(offer.requested_money)}</p>${offer.recipient_id === me?.user_id ? `<button data-accept="${offer.id}">ACCEPT</button>` : ""}</div>`;
}
function weaponCard(item, market) {
  const base = weaponById(item.weapon_id); if (!base) return ""; const weapon = weaponStatsAtLevel(base, item.level);
  const dps = weapon.cooldown > 0 ? weapon.damage * Math.max(1, weapon.projectileCount ?? 1) / weapon.cooldown : weapon.damage;
  return `<button class="profile-weapon-card" data-weapon="${weapon.id}"><canvas width="150" height="90" data-weapon-art="${weapon.id}"></canvas><div><h3>${escapeHtml(weapon.name)}</h3><p>${weapon.rarity}${weapon.limited ? " · LIMITED" : ""}</p><dl><dt>LEVEL</dt><dd>${item.level}</dd><dt>DAMAGE</dt><dd>${rounded(weapon.damage)}</dd><dt>ATTACK SPEED</dt><dd>${rounded(weapon.cooldown)}s</dd><dt>DPS</dt><dd>${rounded(dps)}</dd><dt>RANGE</dt><dd>${rounded((weapon.projectileSpeed ?? 0) * (weapon.projectileLifetime ?? 0) || weapon.range || 0)}</dd><dt>VALUE</dt><dd>${formatMoney(estimateWeaponValue(weapon.id, market[weapon.id]))}</dd></dl><p>${escapeHtml(weapon.description)}</p></div></button>`;
}
function drawWeaponCanvases(root) { root.querySelectorAll("canvas[data-weapon-art]").forEach((canvas) => { const context = canvas.getContext("2d"); context.imageSmoothingEnabled = false; context.translate(25, 45); context.scale(2.4, 2.4); renderHeldWeaponVisual(context, weaponById(canvas.dataset.weaponArt)); }); }
function rounded(value) { return Number.isFinite(Number(value)) ? Math.round(Number(value) * 100) / 100 : "—"; }
function escapeHtml(value) { const node = document.createElement("span"); node.textContent = String(value ?? ""); return node.innerHTML; }
