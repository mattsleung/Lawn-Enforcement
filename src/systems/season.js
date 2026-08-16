const SEASON_QUEST_COUNT = 3;
export const SEASON_DAILY_CLAIM_LIMIT = 6;
export const RAINBOW_APPLE_COST = 5;
export const PARTY_HAT_COST = 25;
export const SEASON_COIN_EXCHANGE_VALUE = 800;
export const SEASON_END_AT = new Date(2026, 9, 1).getTime();
export const SEASON_ACTIVE = Date.now() < SEASON_END_AT;
const SEASON_WEAPONS = Object.freeze({ "rainbow-apples": RAINBOW_APPLE_COST, "party-hat": PARTY_HAT_COST });

const QUESTS = Object.freeze([
  { id: "season-gnomes", type: "enemy-kills", targetId: "gnome", goal: 40, reward: 1, label: "Defeat 40 Lawn Gnomes", maps: ["backyard"] },
  { id: "season-weeds", type: "enemy-kills", targetId: "common-weed", goal: 75, reward: 1, label: "Defeat 75 Common Weeds", maps: ["community-garden", "aquatic-garden"] },
  { id: "season-gophers", type: "enemy-kills", targetId: "gopher", goal: 30, reward: 1, label: "Defeat 30 Gophers", maps: ["frontyard", "golf-course"] },
  { id: "season-enemies", type: "total-kills", goal: 100, reward: 1, label: "Defeat 100 enemies" },
  { id: "season-play", type: "play-time", goal: 5 * 60, reward: 1, label: "Play for 5 minutes" },
  { id: "season-apples", type: "weapon-kills", targetId: "apples", weaponId: "apples", goal: 25, reward: 1, label: "Defeat 25 enemies with Apples" },
  { id: "season-cola", type: "weapon-kills", targetId: "diet-cola-launcher", weaponId: "diet-cola-launcher", goal: 15, reward: 1, label: "Defeat 15 enemies with Diet Cola Launcher" },
]);
const QUESTS_BY_ID = new Map(QUESTS.map((quest) => [quest.id, quest]));

export function ensureSeasonState(progress, now = Date.now(), random = Math.random) {
  const day = localDayKey(now);
  const current = progress.season;
  if (!current || !Array.isArray(current.quests)) {
    progress.season = { coins: 0, quests: [], claimDay: day, claimsToday: 0 };
  }
  const state = progress.season;
  for (const quest of state.quests) {
    const definition = QUESTS_BY_ID.get(quest.id);
    if (!definition) continue;
    const progressAmount = Math.max(0, Number(quest.progress) || 0);
    Object.assign(quest, definition, { progress: Math.min(definition.goal, progressAmount) });
    quest.completed = quest.progress >= quest.goal;
  }
  state.coins = Math.max(0, Math.floor(state.coins ?? 0));
  if (state.claimDay !== day) {
    state.claimDay = day;
    state.claimsToday = 0;
  }
  state.claimsToday = Math.max(0, Math.min(SEASON_DAILY_CLAIM_LIMIT, Math.floor(state.claimsToday ?? 0)));
  fillQuestSlots(progress, state, random);
  return state;
}

export function updateSeasonQuestProgress(progress, event, now = Date.now(), random = Math.random) {
  const state = ensureSeasonState(progress, now, random);
  for (const quest of state.quests) {
    if (quest.completed) continue;
    let amount = 0;
    if (quest.type === "play-time" && event.type === "play-time") amount = event.amount ?? 0;
    if (quest.type === "total-kills" && event.type === "enemy-kill") amount = 1;
    if (quest.type === "enemy-kills" && event.type === "enemy-kill" && event.enemyType === quest.targetId) amount = 1;
    if (quest.type === "weapon-kills" && event.type === "enemy-kill" && event.weaponId === quest.targetId) amount = 1;
    if (amount <= 0) continue;
    quest.progress = Math.min(quest.goal, quest.progress + amount);
    quest.completed = quest.progress >= quest.goal;
  }
}

export function claimCompletedSeasonQuests(progress, now = Date.now(), random = Math.random) {
  const state = ensureSeasonState(progress, now, random);
  let remaining = SEASON_DAILY_CLAIM_LIMIT - state.claimsToday;
  let coins = 0;
  let claimed = 0;
  state.quests = state.quests.filter((quest) => {
    if (!quest.completed || remaining <= 0) return true;
    remaining -= 1;
    claimed += 1;
    coins += quest.reward;
    return false;
  });
  state.claimsToday += claimed;
  state.coins += coins;
  fillQuestSlots(progress, state, random);
  return { claimed, coins, remaining: SEASON_DAILY_CLAIM_LIMIT - state.claimsToday };
}

export function buySeasonWeapon(progress, weaponId, cost = SEASON_WEAPONS[weaponId]) {
  const state = ensureSeasonState(progress);
  if (!SEASON_ACTIVE || !Number.isFinite(cost) || state.coins < cost || progress.ownedWeapons.includes(weaponId)) return false;
  state.coins -= cost;
  progress.ownedWeapons.push(weaponId);
  progress.weaponLevels ??= {};
  progress.weaponLevels[weaponId] = 1;
  return true;
}

export function exchangeSeasonCoin(progress) {
  const state = ensureSeasonState(progress);
  if (!SEASON_ACTIVE || state.coins < 1) return false;
  state.coins -= 1;
  progress.coins = Math.max(0, progress.coins ?? 0) + SEASON_COIN_EXCHANGE_VALUE;
  return true;
}

function fillQuestSlots(progress, state, random) {
  const unlocked = new Set(progress.unlockedMaps ?? ["backyard"]);
  const owned = new Set(progress.ownedWeapons ?? []);
  const activeIds = new Set(state.quests.map((quest) => quest.id));
  const pool = QUESTS.filter((quest) => !activeIds.has(quest.id)
    && (!quest.maps || quest.maps.some((mapId) => unlocked.has(mapId)))
    && (!quest.weaponId || owned.has(quest.weaponId)));
  while (state.quests.length < SEASON_QUEST_COUNT && pool.length) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    state.quests.push({ ...pool.splice(index, 1)[0], progress: 0, completed: false });
  }
}

function localDayKey(now) {
  const date = new Date(now);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
