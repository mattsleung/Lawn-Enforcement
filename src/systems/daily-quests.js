const ENEMY_QUESTS = Object.freeze([
  { id: "gnome-hunt", type: "enemy-kills", targetId: "gnome", goal: 100, reward: 1500, label: "Defeat 100 Lawn Gnomes", maps: ["backyard"] },
  { id: "weed-whacking", type: "enemy-kills", targetId: "common-weed", goal: 300, reward: 5000, label: "Defeat 300 Common Weeds", maps: ["community-garden", "aquatic-garden"] },
  { id: "gopher-control", type: "enemy-kills", targetId: "gopher", goal: 75, reward: 2000, label: "Defeat 75 Gophers", maps: ["frontyard", "golf-course"] },
  { id: "squirrel-patrol", type: "enemy-kills", targetId: "squirrel", goal: 100, reward: 2500, label: "Defeat 100 Squirrels", maps: ["public-park", "lake-elizabeth"] },
  { id: "mosquito-season", type: "enemy-kills", targetId: "mosquito", goal: 80, reward: 2500, label: "Defeat 80 Mosquitoes", maps: ["redwood-trail"] },
]);

const GENERAL_QUESTS = Object.freeze([
  { id: "lawn-clearing", type: "total-kills", goal: 250, reward: 3000, label: "Defeat 250 enemies" },
  { id: "long-shift", type: "play-time", goal: 20 * 60, reward: 3500, label: "Play for 20 minutes" },
  { id: "cola-cleanup", type: "weapon-kills", targetId: "diet-cola-launcher", goal: 50, reward: 4000, label: "Defeat 50 enemies with Diet Cola Launcher", weaponId: "diet-cola-launcher" },
]);

const QUEST_REWARDS = new Map(
  [...ENEMY_QUESTS, ...GENERAL_QUESTS].map((quest) => [quest.id, quest.reward]),
);

export function ensureDailyQuests(progress, now = Date.now(), random = Math.random) {
  const current = progress.dailyQuests;
  if (validDailyState(current) && current.refreshAt > now) {
    // Preserve active progress while migrating older rolling 24-hour saves to
    // the next local-noon reset boundary.
    if (!isLocalNoon(current.refreshAt)) current.refreshAt = nextDailyQuestReset(now);
    for (const quest of current.quests) {
      const currentReward = QUEST_REWARDS.get(quest.id);
      if (currentReward !== undefined) quest.reward = currentReward;
    }
    return current;
  }
  const unlocked = new Set(progress.unlockedMaps ?? ["backyard"]);
  const owned = new Set(progress.ownedWeapons ?? []);
  const eligible = [
    ...ENEMY_QUESTS.filter((quest) => quest.maps.some((mapId) => unlocked.has(mapId))),
    ...GENERAL_QUESTS.filter((quest) => !quest.weaponId || owned.has(quest.weaponId)),
  ];
  const selected = [];
  const pool = [...eligible];
  while (selected.length < Math.min(3, pool.length)) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
    selected.push({ ...pool.splice(index, 1)[0], progress: 0, completed: false, rewarded: false });
  }
  progress.dailyQuests = { refreshAt: nextDailyQuestReset(now), quests: selected };
  return progress.dailyQuests;
}

export function nextDailyQuestReset(now = Date.now()) {
  const reset = new Date(now);
  reset.setHours(12, 0, 0, 0);
  if (reset.getTime() <= now) reset.setDate(reset.getDate() + 1);
  return reset.getTime();
}

export function updateDailyQuestProgress(progress, event, now = Date.now(), random = Math.random) {
  const state = ensureDailyQuests(progress, now, random);
  let coinsAwarded = 0;
  for (const quest of state.quests) {
    if (quest.completed) continue;
    let amount = 0;
    if (quest.type === "play-time" && event.type === "play-time") amount = event.amount ?? 0;
    if (quest.type === "total-kills" && event.type === "enemy-kill") amount = 1;
    if (quest.type === "enemy-kills" && event.type === "enemy-kill" && event.enemyType === quest.targetId) amount = 1;
    if (quest.type === "weapon-kills" && event.type === "enemy-kill" && event.weaponId === quest.targetId) amount = 1;
    if (amount <= 0) continue;
    quest.progress = Math.min(quest.goal, quest.progress + amount);
    if (quest.progress >= quest.goal) {
      quest.completed = true;
      quest.rewarded = true;
      coinsAwarded += quest.reward;
    }
  }
  if (coinsAwarded > 0) progress.coins = Math.max(0, progress.coins ?? 0) + coinsAwarded;
  return coinsAwarded;
}

export function dailyQuestTimeRemaining(progress, now = Date.now()) {
  return Math.max(0, (progress.dailyQuests?.refreshAt ?? now) - now);
}

export function formatQuestTimer(milliseconds) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const remainder = seconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function validDailyState(value) {
  return value && Number.isFinite(value.refreshAt) && Array.isArray(value.quests)
    && value.quests.length > 0 && value.quests.every((quest) => typeof quest.id === "string" && Number.isFinite(quest.goal));
}

function isLocalNoon(timestamp) {
  const date = new Date(timestamp);
  return date.getHours() === 12 && date.getMinutes() === 0
    && date.getSeconds() === 0 && date.getMilliseconds() === 0;
}
