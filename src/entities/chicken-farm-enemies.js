class FarmEnemy {
  constructor({ x, y, health, speed, damage, radius, enemyType, coinValue = 2, xpValue = 15 }) {
    Object.assign(this, { x, y, speed, damage, radius, enemyType, coinValue, xpValue });
    this.maxHealth = health; this.health = health; this.shield = 0; this.maxShield = 0;
    this.hitFlash = 0; this.slowTime = 0; this.speedBuffTime = 0; this.bossMinion = false;
  }
  get active() { return this.health > 0; }
  takeDamage(amount) { if (!this.active) return false; let damage=Math.max(0,Number(amount)||0);const blocked=Math.min(this.shield,damage);this.shield-=blocked;damage-=blocked;this.health=Math.max(0,this.health-damage);this.hitFlash=0.12;return this.health===0; }
  chase(target, dt, multiplier = 1) { const dx = target.x - this.x; const dy = target.y - this.y; const d = Math.hypot(dx, dy) || 1; this.x += dx / d * this.speed * multiplier * dt; this.y += dy / d * this.speed * multiplier * dt; }
  tick(dt) { this.hitFlash = Math.max(0, this.hitFlash - dt); this.speedBuffTime = Math.max(0, this.speedBuffTime - dt); }
  bar(c, x, y) { c.fillStyle="#38271e";c.fillRect(x-this.radius,y-this.radius-10,this.radius*2,4);c.fillStyle="#d95b49";c.fillRect(x-this.radius,y-this.radius-10,this.radius*2*this.health/this.maxHealth,4);if(this.shield>0){c.fillStyle="#65d7f2";c.fillRect(x-this.radius,y-this.radius-16,this.radius*2*Math.min(1,this.shield/Math.max(1,this.maxShield)),4);} }
}

export class Chicken extends FarmEnemy {
  constructor({ x, y } = {}) {
    super({ x, y, health: 150, speed: 140, damage: 8, radius: 19, enemyType: "chicken", coinValue: 3, xpValue: 20 });
    this.sprintTimer = 1.8 + Math.random() * 2.4;
    this.sprintTime = 0;
    this.turnTimer = 0;
    this.strafe = Math.random() < 0.5 ? -1 : 1;
    this.wanderAngle = (Math.random() - 0.5) * 1.4;
  }
  update(dt,target){
    this.tick(dt);this.sprintTimer-=dt;this.sprintTime=Math.max(0,this.sprintTime-dt);this.turnTimer-=dt;
    if(this.sprintTimer<=0){this.sprintTime=.45+Math.random()*.65;this.sprintTimer=1.8+Math.random()*3;this.turnTimer=0;}
    if(this.turnTimer<=0){
      this.strafe=Math.random()<.5?-1:1;
      this.wanderAngle=(Math.random()-.5)*(this.sprintTime>0?3.3:2.5);
      this.turnTimer=.09+Math.random()*.34;
    }
    const dx=target.x-this.x,dy=target.y-this.y,d=Math.hypot(dx,dy)||1;
    const targetAngle=Math.atan2(dy,dx), zigAngle=targetAngle+this.wanderAngle+this.strafe*.42;
    const pursuit=this.sprintTime>0?.58:.42;
    let moveX=Math.cos(zigAngle)*(1-pursuit)+dx/d*pursuit;
    let moveY=Math.sin(zigAngle)*(1-pursuit)+dy/d*pursuit;
    const moveLength=Math.hypot(moveX,moveY)||1;moveX/=moveLength;moveY/=moveLength;
    const buff=this.speedBuffTime>0?1.5:1;const sprint=this.sprintTime>0?2.05:1;
    this.x+=moveX*this.speed*buff*sprint*dt;this.y+=moveY*this.speed*buff*sprint*dt;return{};
  }
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);if(this.speedBuffTime>0){c.fillStyle="rgba(255,198,55,.32)";c.fillRect(x-22,y-31,48,55);c.fillStyle="#ffdf55";c.fillRect(x-20,y-18,4,4);c.fillRect(x+23,y-8,4,4);}c.fillStyle=this.hitFlash>0?"#fff":this.speedBuffTime>0?"#fff0a8":"#f4f0dc";c.fillRect(x-16,y-14,29,27);c.fillRect(x+6,y-23,16,17);c.fillStyle=this.speedBuffTime>0?"#ff7b32":"#d94a38";c.fillRect(x+8,y-28,8,6);c.fillStyle="#e7a939";c.fillRect(x+20,y-18,8,5);c.fillStyle="#2b241f";c.fillRect(x+14,y-20,3,3);c.fillRect(x-10,y+13,4,8);c.fillRect(x+6,y+13,4,8);this.bar(c,x,y);}
}

export class Chick extends FarmEnemy {
  constructor({ x, y } = {}) { super({ x, y, health: 75, speed: 220, damage: 4, radius: 12, enemyType: "chick", coinValue: 1, xpValue: 10 }); this.age=0;this.transformTime=0; }
  update(dt,target){this.tick(dt);this.age+=dt;if(this.age>=20&&this.transformTime<=0)this.transformTime=1;if(this.transformTime>0){this.transformTime-=dt;if(this.transformTime<=0)return{grow:true};return{};}this.chase(target,dt,this.speedBuffTime>0?1.5:1);return{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);const scale=this.transformTime>0?1+(1-this.transformTime)*.5:1;if(this.speedBuffTime>0){c.fillStyle="rgba(255,190,35,.4)";c.fillRect(x-15,y-16,33,34);c.fillStyle="#fff07a";c.fillRect(x-17,y-4,4,4);c.fillRect(x+16,y-12,4,4);}c.fillStyle=this.hitFlash>0?"#fff":this.speedBuffTime>0?"#ffea62":"#f5cf45";c.fillRect(x-10*scale,y-10*scale,20*scale,20*scale);c.fillStyle="#e69a2d";c.fillRect(x+8,y-3,7,4);c.fillStyle="#2a241e";c.fillRect(x+3,y-5,3,3);this.bar(c,x,y);}
}

export class ChickenEgg extends FarmEnemy {
  constructor({ x, y } = {}) { super({ x, y, health: 100, speed: 62, damage: 5, radius: 14, enemyType: "chicken-egg", coinValue: 1, xpValue: 8 }); this.hatchTimer=10;this.rotation=0; }
  update(dt,target){this.tick(dt);this.hatchTimer-=dt;this.rotation+=dt*5;this.chase(target,dt);return this.hatchTimer<=0?{hatch:true}:{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);c.save();c.translate(x,y);c.rotate(Math.sin(this.rotation)*.25);c.fillStyle=this.hitFlash>0?"#fff":"#f4ead2";c.fillRect(-11,-15,22,29);c.fillStyle="#d4c59f";c.fillRect(-7,-12,5,4);c.restore();this.bar(c,x,y);}
}

export class Rooster extends FarmEnemy {
  constructor({ x, y } = {}) { super({ x, y, health: 500, speed: 100, damage: 12, radius: 25, enemyType: "rooster", coinValue: 6, xpValue: 45 }); this.crowTimer=5;this.crowFlash=0; }
  update(dt,target){this.tick(dt);this.crowTimer-=dt;this.crowFlash=Math.max(0,this.crowFlash-dt);if(this.crowTimer<=0){this.crowTimer=5;this.crowFlash=.6;return{crow:{radius:260,duration:3}};}this.chase(target,dt);return{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);c.fillStyle=this.hitFlash>0?"#fff":"#9f4f35";c.fillRect(x-21,y-20,38,38);c.fillStyle="#e8d7b0";c.fillRect(x+4,y-31,21,22);c.fillStyle="#d83737";c.fillRect(x+7,y-38,15,8);c.fillStyle="#e9ae39";c.fillRect(x+23,y-24,9,6);if(this.crowFlash>0){c.strokeStyle=`rgba(255,220,90,${this.crowFlash})`;c.lineWidth=4;c.beginPath();c.arc(x,y,260*(1-this.crowFlash/.6),0,Math.PI*2);c.stroke();}this.bar(c,x,y);}
}
