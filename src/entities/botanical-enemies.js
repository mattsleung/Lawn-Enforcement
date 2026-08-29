const moveToward = (enemy, target, dt, multiplier = 1) => {
  const dx = target.x - enemy.x; const dy = target.y - enemy.y; const distance = Math.hypot(dx, dy) || 1;
  enemy.x += dx / distance * enemy.speed * multiplier * dt;
  enemy.y += dy / distance * enemy.speed * multiplier * dt;
};

class BotanicalEnemy {
  constructor({ x, y, health, speed, damage, radius, type, coinValue, xpValue }) {
    Object.assign(this, { x, y, maxHealth: health, health, speed, damage, radius, enemyType: type, coinValue, xpValue });
    this.hitFlash = 0; this.slowTime = 0; this.freezeTime = 0;
  }
  get active() { return this.health > 0; }
  status(dt) { this.hitFlash = Math.max(0, this.hitFlash - dt); this.slowTime = Math.max(0, this.slowTime - dt); }
  takeDamage(amount) { if (!this.active) return false; this.health = Math.max(0, this.health - Math.max(0, amount)); this.hitFlash = .12; return this.health === 0; }
  healthBar(context) { context.fillStyle="#211c18";context.fillRect(-this.radius,-this.radius-17,this.radius*2,4);context.fillStyle="#8fd267";context.fillRect(-this.radius+1,-this.radius-16,(this.radius*2-2)*(this.health/this.maxHealth),2); }
}

export class Cactus extends BotanicalEnemy {
  constructor({ x, y }) { super({ x, y, health:700, speed:38, damage:10, radius:25, type:"cactus", coinValue:8, xpValue:50 }); this.needleTimer=4;this.warning=0; }
  update(dt,target){this.status(dt);if(!this.active)return{};if(this.warning>0){this.warning-=dt;if(this.warning<=0){this.needleTimer=4;return{needleBurst:true};}return{};}this.needleTimer-=dt;if(this.needleTimer<=0){this.warning=.55;return{};}moveToward(this,target,dt,this.slowTime>0?.5:1);return{};}
  render(c,camera){if(!this.active)return;const x=this.x-camera.x,y=this.y-camera.y;c.save();c.translate(x,y);if(this.warning>0){c.strokeStyle="#f7df73";c.lineWidth=4;c.beginPath();c.arc(0,0,34+Math.sin(this.warning*28)*4,0,Math.PI*2);c.stroke();}c.fillStyle=this.hitFlash>0?"#fff4c4":"#3f8b4a";c.fillRect(-15,-26,30,52);c.fillRect(-27,-10,12,25);c.fillRect(15,-18,12,25);c.fillStyle="#d8e49b";for(let i=-20;i<=20;i+=10){c.fillRect(-19,i,5,2);c.fillRect(14,i+3,5,2);}this.healthBar(c);c.restore();}
}

export class Snapflower extends BotanicalEnemy {
  constructor({ x,y }){super({x,y,health:400,speed:88,damage:12,radius:22,type:"snapflower",coinValue:5,xpValue:30});this.warning=0;this.lunge=0;this.lungeX=0;this.lungeY=0;this.lungeDamage=28;}
  update(dt,target){this.status(dt);if(!this.active)return{};if(this.lunge>0){this.lunge-=dt;this.x+=this.lungeX*dt;this.y+=this.lungeY*dt;this.damage=this.lungeDamage;return{};}this.damage=12;if(this.warning>0){this.warning-=dt;if(this.warning<=0){const dx=target.x-this.x,dy=target.y-this.y,d=Math.hypot(dx,dy)||1;this.lungeX=dx/d*390;this.lungeY=dy/d*390;this.lunge=.42;}return{};}const d=Math.hypot(target.x-this.x,target.y-this.y);if(d<175){this.warning=.55;return{};}moveToward(this,target,dt,this.slowTime>0?.5:1);return{};}
  render(c,camera){if(!this.active)return;const x=this.x-camera.x,y=this.y-camera.y;c.save();c.translate(x,y);c.fillStyle="#3e7d38";c.fillRect(-5,-2,10,30);const open=this.warning>0||this.lunge>0;c.fillStyle=this.hitFlash>0?"#fff2cf":"#c74778";for(let i=0;i<6;i++){const a=i/6*Math.PI*2,r=open?20:13;c.fillRect(Math.cos(a)*r-6,Math.sin(a)*r-15,12,13);}c.fillStyle="#5d263b";c.fillRect(-9,-17,18,18);if(this.warning>0){c.strokeStyle="#ffdb8a";c.lineWidth=3;c.beginPath();c.arc(0,-8,30,0,Math.PI*2);c.stroke();}this.healthBar(c);c.restore();}
}

export class SunflowerEnemy extends BotanicalEnemy {
  constructor({x,y}){super({x,y,health:500,speed:54,damage:5,radius:23,type:"sunflower",coinValue:6,xpValue:40});this.healRadius=155;this.healRate=10;}
  update(dt,target,obstacles,enemies=[]){this.status(dt);if(!this.active)return{};const allies=enemies.filter(e=>e!==this&&e.active&&!e.isBoss);const center=allies.length?allies.reduce((a,e)=>({x:a.x+e.x/allies.length,y:a.y+e.y/allies.length}),{x:0,y:0}):target;if(Math.hypot(center.x-this.x,center.y-this.y)>85)moveToward(this,center,dt,this.slowTime>0?.5:1);return{healAura:{radius:this.healRadius,rate:this.healRate}};}
  render(c,camera){if(!this.active)return;const x=this.x-camera.x,y=this.y-camera.y;c.save();c.translate(x,y);c.fillStyle="rgba(250,220,74,.14)";c.beginPath();c.arc(0,0,this.healRadius,0,Math.PI*2);c.fill();c.strokeStyle="rgba(255,232,104,.48)";c.lineWidth=3;c.stroke();c.fillStyle="#438344";c.fillRect(-5,-1,10,31);c.fillStyle=this.hitFlash>0?"#fff8c8":"#f2cf45";for(let i=0;i<10;i++){const a=i/10*Math.PI*2;c.fillRect(Math.cos(a)*18-5,Math.sin(a)*18-16,10,12);}c.fillStyle="#76502e";c.fillRect(-10,-18,20,20);this.healthBar(c);c.restore();}
}

export class VineEnemy extends BotanicalEnemy {
  constructor({x,y}){super({x,y,health:300,speed:48,damage:7,radius:24,type:"vine",coinValue:4,xpValue:30});this.vineTimer=5;this.warning=0;this.targetX=x;this.targetY=y;this.vineRange=260;}
  update(dt,target){this.status(dt);if(!this.active)return{};if(this.warning>0){this.warning-=dt;if(this.warning<=0){this.vineTimer=5;return{groundVine:{x1:this.x,y1:this.y,x2:this.targetX,y2:this.targetY,lifetime:3,width:24}};}return{};}this.vineTimer-=dt;if(this.vineTimer<=0){this.warning=.6;const dx=target.x-this.x,dy=target.y-this.y,distance=Math.hypot(dx,dy)||1,reach=Math.min(distance,this.vineRange);this.targetX=this.x+dx/distance*reach;this.targetY=this.y+dy/distance*reach;return{};}moveToward(this,target,dt,this.slowTime>0?.5:1);return{};}
  render(c,camera){
    if(!this.active)return;
    const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);
    c.save();c.translate(x,y);c.imageSmoothingEnabled=false;
    const body=this.hitFlash>0?"#fffbd0":"#72e052",dark="#163d29",light="#c9ff68";
    c.fillStyle="rgba(158,255,78,.18)";c.fillRect(-31,-31,62,62);
    c.fillStyle=dark;
    c.fillRect(-17,-28,18,12);c.fillRect(-11,-19,19,13);c.fillRect(-5,-9,18,14);c.fillRect(1,2,18,14);c.fillRect(-5,13,18,14);c.fillRect(-12,23,17,8);
    c.fillStyle=body;
    c.fillRect(-13,-26,10,10);c.fillRect(-7,-17,11,10);c.fillRect(-1,-7,11,10);c.fillRect(5,4,10,10);c.fillRect(-1,15,10,10);c.fillRect(-9,23,10,6);
    c.fillStyle=dark;
    c.fillRect(-32,-15,19,15);c.fillRect(10,-22,22,15);c.fillRect(-27,7,22,15);c.fillRect(13,15,19,14);
    c.fillStyle="#9df04f";
    c.fillRect(-29,-12,14,9);c.fillRect(14,-19,15,9);c.fillRect(-24,10,16,9);c.fillRect(16,18,13,8);
    c.fillStyle=light;
    c.fillRect(-27,-10,7,4);c.fillRect(17,-17,8,4);c.fillRect(-21,12,8,4);c.fillRect(19,20,7,4);
    c.fillStyle="#40205e";c.fillRect(-14,-25,9,8);c.fillStyle="#fff3a5";c.fillRect(-11,-23,3,3);
    if(this.warning>0){c.strokeStyle="#fff78f";c.lineWidth=6;c.setLineDash([10,7]);c.beginPath();c.moveTo(0,0);c.lineTo(Math.round(this.targetX-this.x),Math.round(this.targetY-this.y));c.stroke();c.setLineDash([]);}
    this.healthBar(c);c.restore();
  }
}
