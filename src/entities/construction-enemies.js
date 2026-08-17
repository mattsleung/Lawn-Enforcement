class ConstructionEnemy {
  constructor({ x, y, health, speed, damage, radius, enemyType, coinValue = 5, xpValue = 40 }) {
    Object.assign(this, { x, y, speed, damage, radius, enemyType, coinValue, xpValue });
    this.maxHealth = health; this.health = health; this.shield = 0; this.maxShield = 0;
    this.hitFlash = 0; this.slowTime = 0; this.bossMinion = false;
  }
  get active() { return this.health > 0; }
  takeDamage(amount) {
    if (!this.active) return false;
    let damage = Math.max(0, Number(amount) || 0);
    const shieldDamage = Math.min(this.shield, damage); this.shield -= shieldDamage; damage -= shieldDamage;
    this.health = Math.max(0, this.health - damage); this.hitFlash = 0.12;
    return this.health === 0;
  }
  move(target, deltaTime, multiplier = 1) {
    const dx = target.x - this.x; const dy = target.y - this.y; const distance = Math.hypot(dx, dy) || 1;
    this.x += dx / distance * this.speed * multiplier * deltaTime; this.y += dy / distance * this.speed * multiplier * deltaTime;
  }
  status(deltaTime) { this.hitFlash = Math.max(0, this.hitFlash - deltaTime); this.slowTime = Math.max(0, this.slowTime - deltaTime); }
  bar(context, x, y) {
    context.fillStyle = "#261d18"; context.fillRect(x - this.radius, y - this.radius - 12, this.radius * 2, 5);
    context.fillStyle = "#db5948"; context.fillRect(x - this.radius, y - this.radius - 12, this.radius * 2 * this.health / this.maxHealth, 5);
    if (this.shield > 0) { context.fillStyle = "#56c6ec"; context.fillRect(x - this.radius, y - this.radius - 18, this.radius * 2 * Math.min(1, this.shield / Math.max(1, this.maxShield)), 4); }
  }
}

export class ConstructionWorker extends ConstructionEnemy {
  constructor({ x, y } = {}) { super({ x, y, health: 500, speed: 72, damage: 12, radius: 24, enemyType: "construction-worker" }); }
  update(dt, target) { this.status(dt); this.move(target, dt, this.speedBuff ? 1.25 : 1); return {}; }
  render(c, camera) { const x = Math.round(this.x-camera.x), y=Math.round(this.y-camera.y); c.fillStyle=this.hitFlash>0?"#fff4c8":"#e4a63b"; c.fillRect(x-18,y-27,36,45); c.fillStyle="#f3cf9b"; c.fillRect(x-13,y-43,26,18); c.fillStyle="#d8be3e"; c.fillRect(x-17,y-47,34,7); c.fillStyle="#5d4936"; c.fillRect(x+17,y-23,6,38); c.fillRect(x+12,y-25,18,7); this.bar(c,x,y); }
}

export class TrafficConeEnemy extends ConstructionEnemy {
  constructor({ x, y } = {}) { super({ x, y, health: 250, speed: 105, damage: 7, radius: 19, enemyType: "traffic-cone" }); this.plantTimer=3; this.plantedTime=0; this.hop=0; }
  update(dt,target) { this.status(dt); if(this.plantedTime>0){this.plantedTime-=dt;return{};} this.plantTimer-=dt; if(this.plantTimer<=0){this.plantedTime=3;this.plantTimer=6;return{};} this.hop+=dt*8; this.move(target,dt,this.speedBuff?1.25:1); return{}; }
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y-(this.plantedTime>0?0:Math.abs(Math.sin(this.hop))*8));c.fillStyle=this.hitFlash>0?"#fff4c8":"#f06b25";c.fillRect(x-20,y+12,40,8);c.fillRect(x-13,y-15,26,29);c.fillStyle="#f5eee0";c.fillRect(x-12,y-2,24,6);if(this.plantedTime>0){c.strokeStyle="rgba(245,170,55,.65)";c.lineWidth=3;c.beginPath();c.arc(x,y,105,0,Math.PI*2);c.stroke();}this.bar(c,x,y);}
}

export class RunawayTire extends ConstructionEnemy {
  constructor({ x,y,world }={}){super({x,y,health:300,speed:430,damage:18,radius:22,enemyType:"runaway-tire"});this.world=world;this.heading=0;this.bounces=0;this.rotation=0;}
  update(dt,target){this.status(dt);if(this.bounces>=3){this.heading=Math.atan2(target.y-this.y,target.x-this.x);this.bounces=0;}if(this.heading===0)this.heading=Math.atan2(target.y-this.y,target.x-this.x);this.x+=Math.cos(this.heading)*this.speed*dt;this.y+=Math.sin(this.heading)*this.speed*dt;let bounced=false;if(this.x<this.radius||this.x>this.world.width-this.radius){this.heading=Math.PI-this.heading;bounced=true;}if(this.y<this.radius||this.y>this.world.height-this.radius){this.heading=-this.heading;bounced=true;}if(bounced)this.bounces++;this.x=Math.max(this.radius,Math.min(this.world.width-this.radius,this.x));this.y=Math.max(this.radius,Math.min(this.world.height-this.radius,this.y));this.rotation+=this.speed*dt/this.radius;return{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);c.save();c.translate(x,y);c.rotate(this.rotation);c.fillStyle="#252525";c.fillRect(-22,-22,44,44);c.fillStyle="#777";c.fillRect(-10,-10,20,20);c.fillStyle="#222";c.fillRect(-5,-5,10,10);c.restore();this.bar(c,x,y);}
}

export class BrickCarrier extends ConstructionEnemy {
  constructor({x,y}={}){super({x,y,health:800,speed:48,damage:15,radius:31,enemyType:"brick-carrier",coinValue:8,xpValue:60});this.throwTimer=4;this.deathBrickBurst={count:10,range:150,speed:380,enemyDamage:50,playerDamage:10};}
  update(dt,target){this.status(dt);this.move(target,dt,this.speedBuff?1.25:1);this.throwTimer-=dt;if(this.throwTimer<=0){this.throwTimer=4;return{throwBrick:{x:this.x,y:this.y,targetX:target.x,targetY:target.y,speed:320,damage:10}};}return{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);c.fillStyle=this.hitFlash>0?"#fff4c8":"#b98b55";c.fillRect(x-25,y-30,50,52);c.fillStyle="#a84432";for(let r=0;r<3;r++)for(let i=0;i<3;i++)c.fillRect(x-25+i*17+(r%2)*5,y-47+r*10,15,8);this.bar(c,x,y);}
}

export class SafetyVestEnemy extends ConstructionEnemy {
  constructor({x,y}={}){super({x,y,health:150,speed:180,damage:0,radius:17,enemyType:"safety-vest",coinValue:3,xpValue:30});this.attachedTo=null;}
  update(dt,target,obstacles,enemies=[]){this.status(dt);if(this.attachedTo?.active&&this.attachedTo.shield>0){this.x=this.attachedTo.x;this.y=this.attachedTo.y-8;return{};}if(this.attachedTo){this.health=0;return{};}const candidates=enemies.filter(e=>e!==this&&e.active&&!e.isBoss&&!(e instanceof SafetyVestEnemy)&&(e.vestCount??0)<3);const recipient=candidates.sort((a,b)=>Math.hypot(a.x-this.x,a.y-this.y)-Math.hypot(b.x-this.x,b.y-this.y))[0];if(!recipient){this.move(target,dt);return{};}this.move(recipient,dt);if(Math.hypot(recipient.x-this.x,recipient.y-this.y)<=recipient.radius+this.radius){this.attachedTo=recipient;recipient.vestCount=(recipient.vestCount??0)+1;recipient.maxShield=(recipient.maxShield??0)+100;recipient.shield=(recipient.shield??0)+100;}return{};}
  render(c,camera){if(this.attachedTo&&!this.attachedTo.active)return;const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);c.fillStyle="#f6a51f";c.fillRect(x-16,y-20,32,36);c.fillStyle="#fff2a8";c.fillRect(x-14,y-5,28,6);c.fillStyle="#4d3327";c.fillRect(x-7,y-20,14,25);this.bar(c,x,y);}
}
