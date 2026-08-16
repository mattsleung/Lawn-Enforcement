export function totalContactDamage(enemies) {
  return enemies.reduce((total, enemy) => {
    const damage = Number.isFinite(enemy.damage) ? Math.max(0, enemy.damage) : 0;
    return total + damage;
  }, 0);
}

export function nearestBounceTarget(projectile, enemies, excludedEnemy) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const enemy of enemies) {
    if (!enemy.active || enemy.targetable === false || enemy === excludedEnemy
      || (!projectile.allowRepeatBounces && projectile.hitEnemies.has(enemy))) continue;
    const distance = Math.hypot(enemy.x - projectile.x, enemy.y - projectile.y);
    if (distance < nearestDistance) {
      nearest = enemy;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function applyKnockback(enemy, sourceX, sourceY, amount, bounds = null) {
  if (!amount || enemy.isBoss) return;
  const offsetX = enemy.x - sourceX;
  const offsetY = enemy.y - sourceY;
  const length = Math.hypot(offsetX, offsetY) || 1;
  enemy.x += offsetX / length * amount;
  enemy.y += offsetY / length * amount;
  if (bounds) {
    enemy.x = Math.max(enemy.radius, Math.min(bounds.width - enemy.radius, enemy.x));
    enemy.y = Math.max(enemy.radius, Math.min(bounds.height - enemy.radius, enemy.y));
  }
}

export function applyFire(enemy, damagePerSecond = 5, duration = 10, maxStacks = 1) {
  enemy.fireTime = Math.max(enemy.fireTime ?? 0, duration);
  enemy.fireDamagePerStack = Math.max(enemy.fireDamagePerStack ?? 0, damagePerSecond);
  enemy.fireTickTimer = enemy.fireTickTimer ?? 0;
  const currentStacks = Math.max(0, enemy.fireStacks ?? 0);
  enemy.fireStacks = maxStacks > 1
    ? Math.min(maxStacks, currentStacks + 1)
    : Math.max(1, currentStacks);
  enemy.fireDamagePerSecond = enemy.fireDamagePerStack * enemy.fireStacks;
}

export function applyFreeze(enemy, duration = 2) {
  enemy.freezeTime = Math.max(enemy.freezeTime ?? 0, duration);
}

export function updateEnemyStatus(enemy, deltaTime) {
  const fireTickInterval = 0.5;
  const frozen = (enemy.freezeTime ?? 0) > 0;
  enemy.freezeTime = Math.max(0, (enemy.freezeTime ?? 0) - deltaTime);
  const burningTime = Math.min(Math.max(0, deltaTime), enemy.fireTime ?? 0);
  enemy.fireTickTimer = (enemy.fireTickTimer ?? 0) + burningTime;
  let fireDamage = 0;
  // Fire deals its configured DPS in two readable half-second pulses rather than
  // scattering fractional damage across every simulation frame.
  while (enemy.fireTickTimer >= fireTickInterval && (enemy.fireTime ?? 0) > 0) {
    fireDamage += (enemy.fireDamagePerSecond ?? 0) * fireTickInterval;
    enemy.fireTickTimer -= fireTickInterval;
  }
  enemy.fireTime = Math.max(0, (enemy.fireTime ?? 0) - deltaTime);
  if (enemy.fireTime === 0) {
    enemy.fireDamagePerSecond = 0;
    enemy.fireDamagePerStack = 0;
    enemy.fireStacks = 0;
    enemy.fireTickTimer = 0;
  }
  return { frozen, fireDamage };
}
