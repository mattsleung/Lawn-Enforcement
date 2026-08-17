import test from "node:test";
import assert from "node:assert/strict";

import { buySeasonWeapon, claimCompletedSeasonQuests, ensureSeasonState, exchangeSeasonCoin, PARTY_HAT_COST, PINATA_COST, RAINBOW_APPLE_COST, RAINBOW_HORSESHOE_COST, SEASON_COIN_EXCHANGE_VALUE, updateSeasonQuestProgress } from "../src/systems/season.js";
import { defaultProgress, loadProgress, saveProgress, unlockAllWeapons, unlockSeasonWeapons } from "../src/systems/progression.js";

test("season quests fill three eligible slots and do not refresh automatically", () => {
  const progress = defaultProgress();
  const first = ensureSeasonState(progress, 1000, () => 0);
  assert.equal(first.quests.length, 3);
  const ids = first.quests.map((quest) => quest.id);
  assert.deepEqual(ensureSeasonState(progress, 1000 + 10 * 24 * 60 * 60 * 1000, () => 0.9).quests.map((quest) => quest.id), ids);
  assert.equal(first.quests.every((quest) => quest.reward === 1), true);
});

test("claiming completed season quests awards coins and refreshes their slots", () => {
  const progress = defaultProgress();
  const state = ensureSeasonState(progress, 1000, () => 0);
  state.quests[0].progress = state.quests[0].goal;
  state.quests[0].completed = true;
  const result = claimCompletedSeasonQuests(progress, 1000, () => 0);
  assert.equal(result.claimed, 1);
  assert.ok(result.coins > 0);
  assert.equal(state.quests.length, 3);
  assert.equal(state.quests.filter((quest) => quest.completed).length, 0);
});

test("season rewards stop at six claims per day and completed quests stay slotted", () => {
  const progress = defaultProgress();
  const state = ensureSeasonState(progress, 1000, () => 0);
  state.claimsToday = 6;
  state.quests[0].completed = true;
  state.quests[0].progress = state.quests[0].goal;
  const result = claimCompletedSeasonQuests(progress, 1000, () => 0);
  assert.equal(result.claimed, 0);
  assert.equal(state.quests[0].completed, true);
});

test("season weapon quests only use owned weapons", () => {
  const progress = defaultProgress();
  progress.ownedWeapons = ["weedwacker-9000", "apples"];
  const state = ensureSeasonState(progress, 1000, () => 0.999);
  assert.equal(state.quests.some((quest) => quest.weaponId === "diet-cola-launcher"), false);
});

test("Rainbow Apple costs season coins and Limited is separate from rarity", () => {
  const progress = defaultProgress();
  const state = ensureSeasonState(progress, 1000);
  state.coins = RAINBOW_APPLE_COST;
  assert.equal(buySeasonWeapon(progress, "rainbow-apples", RAINBOW_APPLE_COST), true);
  assert.equal(progress.ownedWeapons.includes("rainbow-apples"), true);
  assert.equal(state.coins, 0);
});

test("Party Hat costs 25 Season Coins", () => {
  const progress = defaultProgress();
  const state = ensureSeasonState(progress, 1000);
  state.coins = PARTY_HAT_COST;
  assert.equal(buySeasonWeapon(progress, "party-hat"), true);
  assert.equal(progress.ownedWeapons.includes("party-hat"), true);
  assert.equal(state.coins, 0);
});

test("new Lawn Enforcement limited weapons use Season Coins", () => {
  const progress = defaultProgress();
  const state = ensureSeasonState(progress, 1000);
  state.coins = RAINBOW_HORSESHOE_COST + PINATA_COST;
  assert.equal(buySeasonWeapon(progress, "rainbow-horseshoe"), true);
  assert.equal(buySeasonWeapon(progress, "pinata"), true);
  assert.equal(state.coins, 0);
  assert.equal(progress.ownedWeapons.includes("rainbow-horseshoe"), true);
  assert.equal(progress.ownedWeapons.includes("pinata"), true);
});

test("one Season Coin exchanges for 800 regular Coins", () => {
  const progress = defaultProgress();
  const state = ensureSeasonState(progress, 1000);
  state.coins = 1;
  assert.equal(exchangeSeasonCoin(progress), true);
  assert.equal(state.coins, 0);
  assert.equal(progress.coins, SEASON_COIN_EXCHANGE_VALUE);
});

test("saved season quests migrate to the easier one-coin balance", () => {
  const progress = defaultProgress();
  progress.season = {
    coins: 0, claimDay: "2026-8-15", claimsToday: 0,
    quests: [{ id: "season-gnomes", type: "enemy-kills", goal: 120, reward: 15, progress: 40, completed: false }],
  };
  const state = ensureSeasonState(progress, new Date(2026, 7, 15).getTime(), () => 0);
  assert.equal(state.quests[0].goal, 40);
  assert.equal(state.quests[0].reward, 1);
  assert.equal(state.quests[0].completed, true);
});

test("unlock-all and ordinary progression do not grant Limited weapons", () => {
  const progress = defaultProgress();
  unlockAllWeapons(progress);
  assert.equal(progress.ownedWeapons.includes("rainbow-apples"), false);
});

test("developer season unlock grants every Limited weapon at level one", () => {
  const progress = defaultProgress();
  unlockSeasonWeapons(progress);
  assert.equal(progress.ownedWeapons.includes("rainbow-apples"), true);
  assert.equal(progress.ownedWeapons.includes("party-hat"), true);
  assert.equal(progress.weaponLevels["rainbow-apples"], 1);
  assert.equal(progress.weaponLevels["party-hat"], 1);
});

test("season progress survives save and load", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const progress = defaultProgress();
  ensureSeasonState(progress, 1000, () => 0);
  updateSeasonQuestProgress(progress, { type: "play-time", amount: 12 }, 1000);
  saveProgress(storage, progress);
  assert.equal(loadProgress(storage).season.quests.length, 3);
});
