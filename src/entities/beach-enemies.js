const approach = (self, target, dt, angleOffset = 0, multiplier = 1) => {
  const angle = Math.atan2(target.y - self.y, target.x - self.x) + angleOffset;
  self.x += Math.cos(angle) * self.speed * multiplier * dt;
  self.y += Math.sin(angle) * self.speed * multiplier * dt;
};

class BeachEnemy {
  constructor({ x, y, health, speed, damage, radius, type, coinValue, xpValue }) {
    Object.assign(this, { x, y, maxHealth: health, health, speed, damage, radius, enemyType: type, coinValue, xpValue });
    this.hitFlash = 0; this.slowTime = 0; this.freezeTime = 0; this.shield = 0; this.maxShield = 0;
  }
  get active() { return this.health > 0; }
  tick(dt) { this.hitFlash = Math.max(0, this.hitFlash - dt); }
  takeDamage(amount) {
    let remaining = Math.max(0, amount); const absorbed = Math.min(this.shield, remaining);
    this.shield -= absorbed; remaining -= absorbed; this.health = Math.max(0, this.health - remaining); this.hitFlash = .12;
    return this.health === 0;
  }
  bar(c) { c.fillStyle="#30251e";c.fillRect(-this.radius,-this.radius-13,this.radius*2,4);c.fillStyle="#ef725d";c.fillRect(-this.radius+1,-this.radius-12,(this.radius*2-2)*this.health/this.maxHealth,2); }
}

export class Crab extends BeachEnemy {
  constructor({x,y}) { super({x,y,health:500,speed:92,damage:16,radius:25,type:"crab",coinValue:5,xpValue:40}); this.waterImmune=true;this.turnTimer=.8;this.offset=.65;this.burst=0; }
  update(dt,target){this.tick(dt);this.turnTimer-=dt;if(this.turnTimer<=0){this.turnTimer=.55+Math.random()*1.2;this.offset=(Math.random()<.5?-1:1)*(.35+Math.random()*.65);this.burst=Math.random()<.35?.35:0;if(Math.random()<.18)this.offset+=Math.PI;}this.burst=Math.max(0,this.burst-dt);approach(this,target,dt,this.offset,this.burst>0?2.1:1);return{};}
  render(c,cam){if(!this.active)return;c.save();c.translate(this.x-cam.x,this.y-cam.y);c.fillStyle=this.hitFlash?"#fff1c8":"#db553f";c.fillRect(-21,-11,42,24);c.fillRect(-34,-8,12,8);c.fillRect(22,-8,12,8);c.fillRect(-31,-22,12,12);c.fillRect(19,-22,12,12);c.fillStyle="#241c1b";c.fillRect(-11,-15,5,5);c.fillRect(7,-15,5,5);this.bar(c);c.restore();}
}

export class HermitCrab extends BeachEnemy {
  constructor({x,y}) { super({x,y,health:1200,speed:42,damage:20,radius:30,type:"hermit-crab",coinValue:10,xpValue:70});this.hideTimer=4+Math.random()*2;this.hiding=0; }
  update(dt,target){this.tick(dt);if(this.hiding>0){this.hiding-=dt;this.damage=0;return{};}this.damage=20;this.hideTimer-=dt;if(this.hideTimer<=0){this.hiding=2;this.hideTimer=5+Math.random()*3;return{};}approach(this,target,dt,0,this.inShallowWater?.7:1);return{};}
  takeDamage(amount){return super.takeDamage(amount*(this.hiding>0?.25:1));}
  render(c,cam){if(!this.active)return;c.save();c.translate(this.x-cam.x,this.y-cam.y);c.fillStyle=this.hitFlash?"#fff0d0":"#ba794c";c.beginPath();c.arc(3,-3,this.hiding>0?28:24,0,Math.PI*2);c.fill();c.strokeStyle="#70412e";c.lineWidth=5;c.beginPath();c.arc(5,-4,13,0,Math.PI*1.7);c.stroke();if(this.hiding<=0){c.fillStyle="#e8654d";c.fillRect(-31,5,30,15);c.fillStyle="#231c1a";c.fillRect(-26,1,5,5);}this.bar(c);c.restore();}
}

export class BeachBallEnemy extends BeachEnemy {
  constructor({x,y,world}) { super({x,y,health:300,speed:520,damage:8,radius:24,type:"beach-ball-enemy",coinValue:4,xpValue:35});this.world=world;this.angle=0;this.bounces=0;this.rotation=0;this.contactKnockback=110; }
  update(dt,target){this.tick(dt);if(!this.velocityX){const a=Math.atan2(target.y-this.y,target.x-this.x);this.velocityX=Math.cos(a)*this.speed;this.velocityY=Math.sin(a)*this.speed;}this.x+=this.velocityX*dt;this.y+=this.velocityY*dt;let hit=false;if(this.x<this.radius||this.x>this.world.width-this.radius){this.velocityX*=-1;hit=true;}if(this.y<this.radius||this.y>this.world.height-this.radius){this.velocityY*=-1;hit=true;}this.x=Math.max(this.radius,Math.min(this.world.width-this.radius,this.x));this.y=Math.max(this.radius,Math.min(this.world.height-this.radius,this.y));if(hit){this.bounces++;const factor=1.1;this.velocityX*=factor;this.velocityY*=factor;if(this.bounces>=4){const a=Math.atan2(target.y-this.y,target.x-this.x);this.velocityX=Math.cos(a)*this.speed*.82;this.velocityY=Math.sin(a)*this.speed*.82;this.bounces=0;}}this.rotation+=Math.hypot(this.velocityX,this.velocityY)*dt/25;return{};}
  render(c,cam){if(!this.active)return;const x=this.x-cam.x,y=this.y-cam.y;c.save();c.translate(x,y);c.rotate(this.rotation);for(let i=0;i<6;i++){c.fillStyle=["#f35d58","#f3d55d","#5fa7ed"][i%3];c.beginPath();c.moveTo(0,0);c.arc(0,0,24,i*Math.PI/3,(i+1)*Math.PI/3);c.fill();}c.fillStyle="#f5f0d8";c.beginPath();c.arc(0,0,6,0,Math.PI*2);c.fill();c.restore();c.save();c.translate(x,y);this.bar(c);c.restore();}
}

export class SandOctopus extends BeachEnemy {
  constructor({x,y}) { super({x,y,health:1500,speed:0,damage:0,radius:27,type:"sand-octopus",coinValue:7,xpValue:50});this.attackRange=360;this.attackTimer=4;this.warning=0;this.targetX=x;this.targetY=y;this.aimAngle=0;this.tentacleVisual=0;this.tentacleVisualDuration=.72; }
  update(dt,target){this.tick(dt);this.aimAngle=Math.atan2(target.y-this.y,target.x-this.x);this.tentacleVisual=Math.max(0,this.tentacleVisual-dt);if(this.warning>0){this.warning-=dt;if(this.warning<=0){this.attackTimer=4;this.tentacleVisual=this.tentacleVisualDuration;return{tentacleStrike:{x:this.targetX,y:this.targetY,radius:58,damage:28,pushback:90}};}return{};}if(Math.hypot(target.x-this.x,target.y-this.y)>this.attackRange)return{};this.attackTimer-=dt;if(this.attackTimer<=0){const dx=target.x-this.x,dy=target.y-this.y,d=Math.hypot(dx,dy)||1,reach=Math.min(this.attackRange,d+Math.random()*45);this.targetX=this.x+dx/d*reach;this.targetY=this.y+dy/d*reach;this.warning=.7;return{tentacleWarning:{x:this.targetX,y:this.targetY,radius:58,lifetime:.7}};}return{};}
  render(c,cam){if(!this.active)return;const x=this.x-cam.x,y=this.y-cam.y;c.save();c.translate(x,y);
    // The dotted circle shows the exact maximum tentacle reach in every direction.
    c.strokeStyle="rgba(119,73,135,.62)";c.lineWidth=3;c.setLineDash([7,9]);c.beginPath();c.arc(0,0,this.attackRange,0,Math.PI*2);c.stroke();c.setLineDash([]);
    if(this.tentacleVisual>0){const elapsed=1-this.tentacleVisual/this.tentacleVisualDuration;const extension=elapsed<.35?elapsed/.35:Math.max(0,1-(elapsed-.35)/.65);const dx=(this.targetX-this.x)*extension,dy=(this.targetY-this.y)*extension;c.strokeStyle="#7f4b91";c.lineWidth=15;c.lineCap="round";c.beginPath();c.moveTo(0,8);c.quadraticCurveTo(dx*.48-dy*.08,dy*.48+dx*.08,dx,dy);c.stroke();c.strokeStyle="#bd82c2";c.lineWidth=5;c.beginPath();c.moveTo(0,6);c.quadraticCurveTo(dx*.48-dy*.08,dy*.48+dx*.08,dx,dy);c.stroke();c.lineCap="butt";}
    c.fillStyle="#d6a46d";c.beginPath();c.ellipse(0,17,34,12,0,0,Math.PI*2);c.fill();c.fillStyle=this.hitFlash?"#fff1cf":"#a66ab2";c.beginPath();c.arc(0,5,24,Math.PI,Math.PI*2);c.fill();c.fillStyle="#fff";c.fillRect(-14,-2,9,10);c.fillRect(5,-2,9,10);c.fillStyle="#201a22";c.fillRect(-10,1,4,5);c.fillRect(8,1,4,5);this.bar(c);c.restore();}
}

export class Lifeguard extends BeachEnemy {
  constructor({x,y}) { super({x,y,health:750,speed:68,damage:8,radius:25,type:"lifeguard",coinValue:8,xpValue:55});this.rescueTimer=5; }
  update(dt,target,obstacles,enemies=[]){this.tick(dt);const d=Math.hypot(target.x-this.x,target.y-this.y);approach(this,target,dt,d<230?Math.PI:0,d<230?1:d>350?.7:0);this.rescueTimer-=dt;if(this.rescueTimer<=0){this.rescueTimer=5;const candidates=enemies.filter(e=>e!==this&&e.active&&!e.isBoss&&Math.hypot(e.x-this.x,e.y-this.y)<420);const rescued=candidates[Math.floor(Math.random()*candidates.length)];if(rescued)return{rescueEnemy:rescued};}return{};}
  render(c,cam){if(!this.active)return;c.save();c.translate(this.x-cam.x,this.y-cam.y);c.fillStyle=this.hitFlash?"#fff3d4":"#e8b279";c.fillRect(-12,-19,24,38);c.fillStyle="#e54842";c.fillRect(-15,0,30,19);c.fillStyle="#fff";c.fillRect(-15,6,30,6);c.fillStyle="#e54842";c.beginPath();c.arc(21,-2,11,0,Math.PI*2);c.strokeStyle="#fff";c.lineWidth=5;c.stroke();this.bar(c);c.restore();}
}
