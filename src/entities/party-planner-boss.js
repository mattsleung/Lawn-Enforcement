export class PartyPlannerBoss {
  constructor({ x, y, config, world }) {
    this.x = x; this.y = y; this.world = world; this.config = config;
    this.name = config.name ?? "The Party Planner";
    this.radius = 48; this.maxHealth = config.health; this.health = config.health;
    this.speed = config.speed ?? 105; this.damage = config.damage ?? 22;
    this.coinValue = 0; this.xpValue = 0; this.enemyType = "party-planner"; this.isBoss = true;
    this.hitFlash = 0; this.slowTime = 0; this.freezeTime = 0; this.shield = 0;
    this.spawnTimer = 3; this.rallyTimer = 6; this.balloonTimer = 7; this.pizzaTimer = 8; this.confettiTimer = 5; this.overloadTimer = 10;
    this.perfectlyPlanned = false; this.phaseTriggered = false; this.random = Math.random;
  }
  get active() { return this.health > 0; }
  takeDamage(amount) { let damage = Math.max(0, amount), absorbed = Math.min(this.shield, damage); this.shield -= absorbed; damage -= absorbed; this.health = Math.max(0, this.health - damage); this.hitFlash = .12; return this.health === 0; }
  update(deltaTime, target, obstacles, enemies = []) {
    this.hitFlash = Math.max(0, this.hitFlash - deltaTime);
    if (!this.active || this.freezeTime > 0) return {};
    const allies = enemies.filter((enemy) => enemy !== this && enemy.active && !enemy.isBoss);
    const anchor = allies.length ? allies.reduce((sum, enemy) => ({ x: sum.x + enemy.x / allies.length, y: sum.y + enemy.y / allies.length }), { x: 0, y: 0 }) : target;
    const angle = Math.atan2(anchor.y - this.y, anchor.x - this.x) + Math.sin(Date.now() / 700) * .35;
    const distance = Math.hypot(anchor.x - this.x, anchor.y - this.y);
    if (distance > 150) { this.x += Math.cos(angle) * this.speed * deltaTime; this.y += Math.sin(angle) * this.speed * deltaTime; }
    const events = {};
    if (!this.perfectlyPlanned && this.health < 10000) { this.perfectlyPlanned = true; events.perfectlyPlanned = true; }
    this.spawnTimer -= deltaTime; this.rallyTimer -= deltaTime; this.balloonTimer -= deltaTime; this.pizzaTimer -= deltaTime; this.confettiTimer -= deltaTime;
    if (this.spawnTimer <= 0) { this.spawnTimer = 3; events.spawnPartygoer = true; }
    if (this.rallyTimer <= 0) { this.rallyTimer = this.perfectlyPlanned ? 4 : 6; events.partyRally = { duration: 4 }; }
    if (this.balloonTimer <= 0) { this.balloonTimer = 7; events.balloonShield = { count: this.perfectlyPlanned ? 6 : 4, amount: 250, duration: 8 }; }
    if (this.pizzaTimer <= 0) { this.pizzaTimer = 8; events.pizzaDelivery = { count: this.perfectlyPlanned ? 7 : 5, amount: 200, selfHeal: 100 }; }
    if (this.confettiTimer <= 0) { this.confettiTimer = 5; events.confettiCannon = { lanes: 7, spread: this.perfectlyPlanned ? 1.25 : .9, damage: 24, knockback: 80, speed: 360 }; }
    if (this.perfectlyPlanned) { this.overloadTimer -= deltaTime; if (this.overloadTimer <= 0) { this.overloadTimer = 10; events.supportOverload = ["hype", "grill", "cooler", "dj", "coach", "firstAid"][Math.floor(this.random() * 6)]; } }
    return events;
  }
  render(context, camera) {
    if (!this.active) return;
    const x = Math.round(this.x - camera.x), y = Math.round(this.y - camera.y);
    context.save(); context.translate(x, y);
    if (this.perfectlyPlanned) { context.strokeStyle = "#ff76d9"; context.lineWidth = 5; context.beginPath(); context.arc(0, 0, 61 + Math.sin(Date.now() / 90) * 5, 0, Math.PI * 2); context.stroke(); }
    context.fillStyle="rgba(20,18,18,.28)";context.fillRect(-47,39,94,10);
    context.fillStyle=this.hitFlash>0?"#fff":"#b74482";context.fillRect(-36,-25,72,63);context.fillStyle="#df6cae";context.fillRect(-30,-18,60,14);context.fillStyle="#f5d864";context.fillRect(-6,-18,12,48);
    context.fillStyle=this.hitFlash>0?"#fff":"#efbd91";context.fillRect(-24,-51,48,29);context.fillStyle="#3b2530";context.fillRect(-27,-59,54,12);context.fillRect(-18,-46,7,7);context.fillRect(11,-46,7,7);context.fillStyle="#a53a73";context.fillRect(-9,-33,18,5);
    context.fillStyle="#f1e2b7";context.fillRect(24,-17,32,42);context.fillStyle="#655440";context.fillRect(30,-10,20,4);context.fillRect(30,0,15,4);context.fillRect(30,10,19,4);context.fillStyle="#e85476";context.fillRect(48,-19,7,7);
    for(const side of[-1,1]){context.fillStyle=side<0?"#61d4df":"#f26c85";context.beginPath();context.arc(side*43,-36,12,0,Math.PI*2);context.fill();context.strokeStyle="#eee5cf";context.lineWidth=2;context.beginPath();context.moveTo(side*43,-24);context.lineTo(side*29,4);context.stroke();}
    context.fillStyle="#25252a";context.fillRect(-31,38,13,12);context.fillRect(18,38,13,12);
    context.fillStyle = "#171817"; context.fillRect(-48, -65, 96, 7); context.fillStyle = "#e56b76"; context.fillRect(-46, -63, 92 * this.health / this.maxHealth, 3);
    context.restore();
  }
}
