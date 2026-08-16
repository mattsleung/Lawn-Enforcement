import test from "node:test";
import assert from "node:assert/strict";

import { dailyQuestTimeRemaining, ensureDailyQuests, formatQuestTimer, nextDailyQuestReset, updateDailyQuestProgress } from "../src/systems/daily-quests.js";
import { defaultProgress, loadProgress, saveProgress } from "../src/systems/progression.js";

test("daily quests reset at the next local 12:00 PM", () => {
  const progress = defaultProgress();
  progress.unlockedMaps = ["backyard", "community-garden"];
  const morning = new Date(2026, 7, 15, 9, 30).getTime();
  const noon = new Date(2026, 7, 15, 12, 0).getTime();
  const first = ensureDailyQuests(progress, morning, () => 0);
  assert.equal(first.refreshAt, noon);
  assert.equal(ensureDailyQuests(progress, noon - 1, () => 0.9), first);
  const refreshed = ensureDailyQuests(progress, first.refreshAt, () => 0.9);
  assert.notEqual(refreshed, first);
  assert.equal(refreshed.refreshAt, new Date(2026, 7, 16, 12, 0).getTime());
});

test("next daily reset is noon today before noon and tomorrow after noon", () => {
  assert.equal(
    nextDailyQuestReset(new Date(2026, 7, 15, 11, 59).getTime()),
    new Date(2026, 7, 15, 12, 0).getTime(),
  );
  assert.equal(
    nextDailyQuestReset(new Date(2026, 7, 15, 12, 0).getTime()),
    new Date(2026, 7, 16, 12, 0).getTime(),
  );
});

test("weapon quests are only generated for owned weapons", () => {
  const progress = defaultProgress();
  progress.unlockedMaps = ["backyard"];
  progress.ownedWeapons = ["apples"];
  const daily = ensureDailyQuests(progress, 0, () => 0.999);
  assert.equal(daily.quests.some((quest) => quest.weaponId === "diet-cola-launcher"), false);
});

test("generated quest rewards scale within the 1,000 to 5,000 coin range", () => {
  const progress = defaultProgress();
  progress.unlockedMaps = ["backyard", "frontyard", "community-garden", "public-park", "redwood-trail"];
  progress.ownedWeapons = ["diet-cola-launcher"];
  const daily = ensureDailyQuests(progress, 0, () => 0.5);
  assert.equal(daily.quests.every((quest) => quest.reward >= 1000 && quest.reward <= 5000), true);
});

test("saved active quests migrate old reward values without losing progress", () => {
  const progress = defaultProgress();
  progress.dailyQuests = {
    refreshAt: 999999,
    quests: [
      { id: "gnome-hunt", type: "enemy-kills", targetId: "gnome", goal: 100, reward: 600, progress: 42, completed: false },
    ],
  };
  const daily = ensureDailyQuests(progress, 0);
  assert.equal(daily.quests[0].reward, 1500);
  assert.equal(daily.quests[0].progress, 42);
});

test("enemy, weapon, and play-time events advance matching quests and award once", () => {
  const progress = defaultProgress();
  progress.dailyQuests = {
    refreshAt: 999999,
    quests: [
      { id: "gnome", type: "enemy-kills", targetId: "gnome", goal: 1, reward: 10, progress: 0, completed: false },
      { id: "cola", type: "weapon-kills", targetId: "diet-cola-launcher", goal: 1, reward: 20, progress: 0, completed: false },
      { id: "time", type: "play-time", goal: 10, reward: 30, progress: 0, completed: false },
    ],
  };
  assert.equal(updateDailyQuestProgress(progress, { type: "enemy-kill", enemyType: "gnome", weaponId: "apples" }, 0), 10);
  assert.equal(updateDailyQuestProgress(progress, { type: "enemy-kill", enemyType: "gopher", weaponId: "diet-cola-launcher" }, 0), 20);
  assert.equal(updateDailyQuestProgress(progress, { type: "play-time", amount: 10 }, 0), 30);
  assert.equal(updateDailyQuestProgress(progress, { type: "play-time", amount: 10 }, 0), 0);
  assert.equal(progress.coins, 60);
});

test("quest countdown formatting is stable", () => {
  const progress = { dailyQuests: { refreshAt: 3_661_000 } };
  assert.equal(dailyQuestTimeRemaining(progress, 1000), 3_660_000);
  assert.equal(formatQuestTimer(3_660_000), "01:01:00");
});

test("daily quest progress survives save and load", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const progress = defaultProgress();
  ensureDailyQuests(progress, 1000, () => 0);
  progress.dailyQuests.quests[0].progress = 12;
  saveProgress(storage, progress);
  assert.equal(loadProgress(storage).dailyQuests.quests[0].progress, 12);
});
