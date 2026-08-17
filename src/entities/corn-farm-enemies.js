class CornEnemy {
  constructor({ x, y, health, speed, damage, radius, enemyType, coinValue, xpValue }) {
    Object.assign(this, { x, y, maxHealth: health, health, speed, damage, radius, enemyType, coinValue, xpValue });
    this.hitFlash=0;this.slowTime=0;this.freezeTime=0;this.bossMinion=false;
  }
  get active(){return this.health>0;}
  takeDamage(amount){this.health=Math.max(0,this.health-Math.max(0,Number(amount)||0));this.hitFlash=.12;return this.health===0;}
  chase(target,dt,m=1){const dx=target.x-this.x,dy=target.y-this.y,d=Math.hypot(dx,dy)||1;this.x+=dx/d*this.speed*m*dt;this.y+=dy/d*this.speed*m*dt;}
  tick(dt){this.hitFlash=Math.max(0,this.hitFlash-dt);this.slowTime=Math.max(0,this.slowTime-dt);}
  bar(c,x,y){c.fillStyle="#3b2516";c.fillRect(x-this.radius,y-this.radius-9,this.radius*2,4);c.fillStyle="#e6b342";c.fillRect(x-this.radius,y-this.radius-9,this.radius*2*this.health/this.maxHealth,4);}
}

export class AngryCorn extends CornEnemy {
  constructor({x,y}={}){super({x,y,health:350,speed:72,damage:8,radius:20,enemyType:"angry-corn",coinValue:3,xpValue:25});this.fireTimer=4;this.warning=0;}
  update(dt,target){this.tick(dt);this.fireTimer-=dt;if(this.warning>0){this.warning-=dt;if(this.warning<=0){this.fireTimer=4;return{cornFan:{targetX:target.x,targetY:target.y,count:3,damage:8,speed:310}};}return{};}if(this.fireTimer<=0){this.warning=.55;return{};}this.chase(target,dt);return{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);if(this.warning>0){c.strokeStyle="#fff19b";c.lineWidth=3;c.beginPath();c.arc(x,y,28+Math.sin(this.warning*30)*4,0,Math.PI*2);c.stroke();}c.fillStyle=this.hitFlash>0?"#fff":"#d8a52d";c.fillRect(x-13,y-22,26,40);c.fillStyle="#4f8a3d";c.fillRect(x-20,y-4,9,22);c.fillRect(x+11,y-4,9,22);c.fillStyle="#291c15";c.fillRect(x-7,y-12,4,4);c.fillRect(x+4,y-12,4,4);this.bar(c,x,y);}
}

export class PopcornEnemy extends CornEnemy {
  constructor({x,y}={}){super({x,y,health:100,speed:185,damage:6,radius:14,enemyType:"popcorn",coinValue:1,xpValue:12});this.deathAoe={radius:90,damage:12,pushback:150};}
  update(dt,target){this.tick(dt);this.chase(target,dt);return{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);c.fillStyle=this.hitFlash>0?"#fff":"#f7e9b5";c.fillRect(x-11,y-9,22,20);c.fillRect(x-7,y-15,8,8);c.fillRect(x+3,y-14,9,8);c.fillStyle="#d65a3a";c.fillRect(x-10,y+7,20,8);this.bar(c,x,y);}
}

export class MiniTractor extends CornEnemy {
  constructor({x,y,world}={}){super({x,y,health:1000,speed:58,damage:28,radius:31,enemyType:"mini-tractor",coinValue:8,xpValue:55});this.world=world;this.chargeTimer=5;this.warning=0;this.chargeTime=0;this.vector={x:1,y:0};}
  update(dt,target){this.tick(dt);this.chargeTimer-=dt;if(this.warning>0){this.warning-=dt;if(this.warning<=0)this.chargeTime=1.1;return{};}if(this.chargeTime>0){this.chargeTime-=dt;this.x+=this.vector.x*470*dt;this.y+=this.vector.y*470*dt;return{harvest:true};}if(this.chargeTimer<=0){const dx=target.x-this.x,dy=target.y-this.y,d=Math.hypot(dx,dy)||1;this.vector={x:dx/d,y:dy/d};this.warning=.75;this.chargeTimer=5;return{};}this.chase(target,dt);return{};}
  render(c,camera){const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y);if(this.warning>0){c.save();c.translate(x,y);c.rotate(Math.atan2(this.vector.y,this.vector.x));c.fillStyle="rgba(255,214,84,.28)";c.fillRect(0,-18,520,36);c.restore();}c.fillStyle="#232921";c.fillRect(x-31,y-16,62,34);c.fillStyle=this.hitFlash>0?"#fff":"#d2a534";c.fillRect(x-24,y-27,43,20);c.fillStyle="#1d211b";c.fillRect(x-27,y+14,16,12);c.fillRect(x+11,y+14,16,12);this.bar(c,x,y);}
}
