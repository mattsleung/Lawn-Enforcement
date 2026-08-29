const clampParty = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

class BlockPartyEnemy {
  constructor({ x, y, health, speed, damage = 7, radius = 22, type, color, coinValue = 5, xpValue = 30 }) {
    Object.assign(this, { x, y, health, maxHealth: health, speed, damage, radius, enemyType: type, color, coinValue, xpValue });
    this.hitFlash = 0;
    this.slowTime = 0;
    this.freezeTime = 0;
    this.shield = 0;
    this.partySpeedBuffTime = 0;
    this.partyRallySpeedTime = 0;
    this.partyRallyAttackTime = 0;
    this.partyDjBoostTime = 0;
    this.partyResistanceTime = 0;
    this.supportShieldTime = 0;
    this.aidFlashTime = 0;
    this.healFlashTime = 0;
    this.coachBoostTime = 0;
    this.partyTrail = [];
    this.wanderPhase = Math.random() * Math.PI * 2;
  }

  get active() { return this.health > 0; }

  takeDamage(amount) {
    if (!this.active) return false;
    let remaining = Math.max(0, amount);
    const absorbed = Math.min(this.shield, remaining);
    this.shield -= absorbed;
    remaining -= absorbed;
    this.health = Math.max(0, this.health - remaining);
    this.hitFlash = .12;
    return this.health === 0;
  }

  tick(deltaTime) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    this.slowTime = Math.max(0, this.slowTime - deltaTime);
    this.freezeTime = Math.max(0, this.freezeTime - deltaTime);
    this.partySpeedBuffTime = Math.max(0, this.partySpeedBuffTime - deltaTime);
    this.partyRallySpeedTime = Math.max(0, this.partyRallySpeedTime - deltaTime);
    this.partyRallyAttackTime = Math.max(0, this.partyRallyAttackTime - deltaTime);
    this.partyDjBoostTime = Math.max(0, this.partyDjBoostTime - deltaTime);
    this.partyResistanceTime = Math.max(0, this.partyResistanceTime - deltaTime);
    this.aidFlashTime = Math.max(0, this.aidFlashTime - deltaTime);
    this.healFlashTime = Math.max(0, this.healFlashTime - deltaTime);
    this.coachBoostTime = Math.max(0, this.coachBoostTime - deltaTime);
    for (const trail of this.partyTrail) trail.life -= deltaTime;
    this.partyTrail = this.partyTrail.filter((trail) => trail.life > 0);
    if (this.partySpeedBuffTime > 0 && (!this.partyTrail.length || Math.hypot(this.x - this.partyTrail[0].x, this.y - this.partyTrail[0].y) > 9)) {
      this.partyTrail.unshift({ x: this.x, y: this.y, life: .42 });
    }
    if (this.supportShieldTime > 0) {
      this.supportShieldTime = Math.max(0, this.supportShieldTime - deltaTime);
      if (this.supportShieldTime === 0) this.shield = 0;
    }
  }

  chase(deltaTime, target, unpredictability = 0) {
    if (this.freezeTime > 0) return;
    this.wanderPhase += deltaTime * 2.1;
    const baseAngle = Math.atan2(target.y - this.y, target.x - this.x);
    const angle = baseAngle + Math.sin(this.wanderPhase) * unpredictability;
    const supportSpeed = 1 + (this.partySpeedBuffTime > 0 ? .35 : 0) + (this.partyRallySpeedTime > 0 ? .25 : 0);
    const slow = this.slowTime > 0 ? .5 : 1;
    this.x += Math.cos(angle) * this.speed * supportSpeed * slow * deltaTime;
    this.y += Math.sin(angle) * this.speed * supportSpeed * slow * deltaTime;
  }

  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x);
    const y = Math.round(this.y - camera.y);
    context.save();
    context.translate(x, y);
    for (const trail of this.partyTrail) {
      context.globalAlpha = trail.life / .42 * .65;
      context.fillStyle = "#ffd85c";
      context.fillRect(Math.round(trail.x - this.x) - 5, Math.round(trail.y - this.y) - 5, 10, 10);
    }
    context.globalAlpha = 1;
    context.fillStyle = "rgba(20,18,18,.25)";
    context.fillRect(-this.radius, this.radius - 2, this.radius * 2, 7);
    this.drawSprite(context, this.hitFlash > 0);
    this.renderBuffVisuals(context);
    if (this.shield > 0) {
      context.strokeStyle = "#8ddfff";
      context.lineWidth = 4;
      context.beginPath();
      context.arc(0, -3, this.radius + 8, 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = "#171817";
    context.fillRect(-this.radius, -this.radius - 15, this.radius * 2, 5);
    context.fillStyle = "#e2795f";
    context.fillRect(-this.radius + 1, -this.radius - 14, (this.radius * 2 - 2) * this.health / this.maxHealth, 3);
    context.restore();
  }

  drawSprite(context, flashing) {
    context.fillStyle = flashing ? "#fff" : this.color;
    context.fillRect(-17, -14, 34, 33);
    context.fillStyle = flashing ? "#fff" : "#edbf91";
    context.fillRect(-12, -29, 24, 17);
    context.fillStyle = "#332921";
    context.fillRect(-8, -25, 5, 5);
    context.fillRect(4, -25, 5, 5);
    context.fillRect(-10, 19, 8, 10);
    context.fillRect(3, 19, 8, 10);
  }

  renderBuffVisuals(context) {
    const pulse = .65 + Math.sin(Date.now() / 90) * .25;
    if ((this.partyDamageResistance ?? 0) > 0) {
      context.fillStyle = "rgba(72,174,245,.32)";
      context.beginPath(); context.arc(0, -2, this.radius + 3, 0, Math.PI * 2); context.fill();
      context.strokeStyle = "rgba(142,225,255,.8)"; context.lineWidth = 2; context.stroke();
    }
    if (((this.partyAttackSpeedMultiplier ?? 1) > 1 && this.partyRallyAttackTime <= 0) || this.partyDjBoostTime > 0) {
      context.fillStyle = `rgba(220,120,255,${pulse})`;
      context.font = "bold 17px monospace"; context.fillText("♪", -this.radius - 9, -18); context.fillText("♫", this.radius - 3, -4);
    }
    if (this.partyRallySpeedTime > 0 || this.partyRallyAttackTime > 0) {
      context.fillStyle = `rgba(255,105,184,${pulse})`;
      for (const side of [-1, 1]) { context.beginPath(); context.moveTo(side * 8, -this.radius - 12); context.lineTo(side * 2, -this.radius - 3); context.lineTo(side * 14, -this.radius - 3); context.fill(); }
    }
    if (this.coachBoostTime > 0) {
      context.strokeStyle = "#ff9c47"; context.lineWidth = 4;
      for (let row = -1; row <= 1; row += 1) { context.beginPath(); context.moveTo(-this.radius - 18, row * 9); context.lineTo(-this.radius - 7, row * 9); context.stroke(); }
    }
    if (this.healFlashTime > 0) {
      context.fillStyle = this.healEffectKind === "pizza" ? "#f4b84e" : "#75df75";
      if (this.healEffectKind === "pizza") { context.beginPath();context.moveTo(-9,-this.radius-11);context.lineTo(10,-this.radius-11);context.lineTo(0,-this.radius-29);context.fill();context.fillStyle="#d95745";context.fillRect(-2,-this.radius-20,5,5); }
      else { context.fillRect(-4,-this.radius-27,8,20);context.fillRect(-10,-this.radius-21,20,8); }
    }
    if (this.aidFlashTime > 0) {
      context.fillStyle = `rgba(235,255,255,${Math.min(1,this.aidFlashTime*2)})`;
      for (const side of [-1,1]) { const px=side*(this.radius+9);context.fillRect(px-3,-18,6,16);context.fillRect(px-8,-13,16,6); }
    }
  }
}

export class Partygoer extends BlockPartyEnemy {
  constructor({ x, y }) { super({ x, y, health: 800, speed: 92, damage: 8, type: "partygoer", color: "#d75c78", coinValue: 6, xpValue: 40 }); }
  update(deltaTime, target) { this.tick(deltaTime); this.chase(deltaTime, target, .2); return {}; }
  drawSprite(context, flashing) { super.drawSprite(context, flashing); context.fillStyle="#f2d35f";context.beginPath();context.moveTo(-14,-29);context.lineTo(0,-45);context.lineTo(14,-29);context.fill();context.fillStyle="#56c8d3";context.fillRect(-12,-7,24,6);context.fillStyle="#fff0b5";context.fillRect(-3,-42,6,5);context.fillStyle="#dfefef";context.fillRect(-10,1,6,6);context.fillRect(5,8,6,6); }
}

export class HypeMan extends BlockPartyEnemy {
  constructor({ x, y }) { super({ x, y, health: 600, speed: 84, type: "hype-man", color: "#e1903f" }); this.shoutTimer = 5; }
  update(deltaTime, target) { this.tick(deltaTime); this.chase(deltaTime, target, .12); this.shoutTimer -= deltaTime * (this.partyAttackSpeedMultiplier ?? 1); if (this.shoutTimer <= 0) { this.shoutTimer = 5; return { hypeShout: { radius: 280, duration: 3 } }; } return {}; }
  drawSprite(context, flashing) { context.save();context.rotate(Math.sin(this.wanderPhase)*.12);context.fillStyle=flashing?"#fff":"#f0c958";context.fillRect(-24,-13,14,25);context.fillStyle=flashing?"#fff":"#e1903f";context.beginPath();context.moveTo(-10,-18);context.lineTo(24,-30);context.lineTo(24,29);context.lineTo(-10,17);context.fill();context.fillStyle="#fff0bd";context.fillRect(21,-24,7,47);context.fillStyle="#69452f";context.fillRect(-19,12,9,20);context.fillStyle="#d95858";context.fillRect(5,-5,14,10);context.restore(); }
}

export class GrillMaster extends BlockPartyEnemy {
  constructor({ x, y }) { super({ x, y, health: 900, speed: 70, type: "grill-master", color: "#a74f3e" }); this.foodTimer = 6; }
  update(deltaTime, target) { this.tick(deltaTime); this.chase(deltaTime, target, .08); this.foodTimer -= deltaTime * (this.partyAttackSpeedMultiplier ?? 1); if (this.foodTimer <= 0) { this.foodTimer = 6; return { grillHeal: { radius: 340, count: 3, amount: 150 } }; } return {}; }
  drawSprite(context, flashing) { context.fillStyle=flashing?"#fff":"#242628";context.fillRect(-29,-10,58,31);context.fillStyle=flashing?"#fff":"#34373a";context.beginPath();context.arc(0,-10,29,Math.PI,0);context.fill();context.strokeStyle="#aeb2aa";context.lineWidth=3;for(let x=-20;x<=20;x+=8){context.beginPath();context.moveTo(x,-15);context.lineTo(x,4);context.stroke();}context.fillStyle="#ef734c";context.fillRect(-14,-12,12,6);context.fillStyle="#e5b451";context.fillRect(4,-11,15,5);context.fillStyle="#171818";context.fillRect(-23,21,7,11);context.fillRect(16,21,7,11);context.fillStyle="#d24c3d";context.fillRect(-4,5,8,8); }
}

export class CoolerCarrier extends BlockPartyEnemy {
  constructor({ x, y }) { super({ x, y, health: 1000, speed: 55, type: "cooler-carrier", color: "#4a8bb8", radius: 25 }); this.auraRadius = 245; }
  update(deltaTime, target) { this.tick(deltaTime); this.chase(deltaTime, target, .05); return {}; }
  drawSprite(context, flashing) { context.fillStyle=flashing?"#fff":"#e8f4ef";context.fillRect(-31,-23,62,14);context.fillStyle=flashing?"#fff":"#4a9bc3";context.fillRect(-31,-9,62,37);context.fillStyle="#286888";context.fillRect(-27,-4,54,7);context.fillRect(-24,20,48,5);context.fillStyle="#c8dedc";context.fillRect(-9,-28,18,5);context.fillRect(-13,-32,5,9);context.fillRect(8,-32,5,9);context.fillStyle="#263d48";context.fillRect(-25,28,9,5);context.fillRect(16,28,9,5); }
}

export class PartyDJ extends BlockPartyEnemy {
  constructor({ x, y }) { super({ x, y, health: 700, speed: 0, damage: 0, type: "party-dj", color: "#7c59a7" }); this.auraRadius = 315; }
  update(deltaTime) { this.tick(deltaTime); return {}; }
  drawSprite(context, flashing) { const pulse=.75+.25*Math.sin(Date.now()/90);context.fillStyle=flashing?"#fff":"#24232d";context.fillRect(-34,-26,68,56);context.fillStyle="#4d495a";context.fillRect(-28,-20,56,13);context.fillStyle="#bfc5c8";context.fillRect(-22,-16,25,4);context.fillStyle="#8e68cf";context.fillRect(11,-17,10,7);for(const side of[-1,1]){context.fillStyle=side<0?`rgba(221,91,224,${pulse})`:`rgba(77,211,229,${pulse})`;context.beginPath();context.arc(side*17,10,12,0,Math.PI*2);context.fill();context.fillStyle="#1c1d22";context.beginPath();context.arc(side*17,10,5,0,Math.PI*2);context.fill();}context.fillStyle="#d6bb59";context.fillRect(-28,30,8,5);context.fillRect(20,30,8,5); }
}

export class PartyCoach extends BlockPartyEnemy {
  constructor({ x, y }) { super({ x, y, health: 750, speed: 80, type: "party-coach", color: "#4c9b62" }); this.whistleTimer = 7; }
  update(deltaTime, target) { this.tick(deltaTime); this.chase(deltaTime, target, .1); this.whistleTimer -= deltaTime * (this.partyAttackSpeedMultiplier ?? 1); if (this.whistleTimer <= 0) { this.whistleTimer = 7; return { coachWhistle: { radius: 330, count: 5, distance: 105 } }; } return {}; }
  drawSprite(context, flashing) { super.drawSprite(context,flashing);context.fillStyle="#f1f1e7";context.fillRect(-17,-10,7,26);context.fillRect(10,-10,7,26);context.fillStyle="#f0d86c";context.fillRect(14,-24,13,6);context.fillStyle="#5c4529";context.fillRect(19,-18,3,11);context.fillStyle="#e9eee3";context.fillRect(-11,-36,22,7);context.fillStyle="#4c9b62";context.fillRect(-8,-40,16,5); }
}

export class FirstAidVolunteer extends BlockPartyEnemy {
  constructor({ x, y }) { super({ x, y, health: 650, speed: 75, type: "first-aid-volunteer", color: "#eee8d7" }); this.shieldTimer = 8; }
  update(deltaTime, target) { this.tick(deltaTime); this.chase(deltaTime, target, .08); this.shieldTimer -= deltaTime * (this.partyAttackSpeedMultiplier ?? 1); if (this.shieldTimer <= 0) { this.shieldTimer = 8; return { firstAidShield: { radius: 350, amount: 400, duration: 7 } }; } return {}; }
  drawSprite(context, flashing) { super.drawSprite(context,flashing);context.fillStyle="#e64e4e";context.fillRect(-4,-9,8,22);context.fillRect(-11,-2,22,8);context.fillStyle="#d8e5e5";context.fillRect(12,2,17,19);context.fillStyle="#cf4646";context.fillRect(18,5,5,13);context.fillRect(14,9,13,5);context.fillStyle="#eee8d7";context.fillRect(-13,-36,26,8);context.fillStyle="#d94b4b";context.fillRect(-4,-39,8,6); }
}

export const BLOCK_PARTY_ENEMY_TYPES = Object.freeze({
  partygoer: Partygoer,
  hype: HypeMan,
  grill: GrillMaster,
  cooler: CoolerCarrier,
  dj: PartyDJ,
  coach: PartyCoach,
  firstAid: FirstAidVolunteer,
});

export function keepPartyEnemyInWorld(enemy, world) {
  enemy.x = clampParty(enemy.x, enemy.radius, world.width - enemy.radius);
  enemy.y = clampParty(enemy.y, enemy.radius, world.height - enemy.radius);
}
