export class QueenRoseBoss {
  constructor({x,y,config}){
    this.x=x;this.y=y;this.radius=72;this.name=config.name;this.maxHealth=config.health;this.health=config.health;this.damage=0;this.speed=0;this.isBoss=true;this.enemyType="queen-rose";this.hitFlash=0;this.slowTime=0;this.shield=0;this.maxShield=1000;this.fullBloom=false;this.fullBloomAnnounced=false;
    this.thornTimer=3;this.petalTimer=4;this.pollenTimer=6;this.spiralTime=0;this.spiralVolleyTimer=0;this.spiralAngle=0;this.config=config;
  }
  get active(){return this.health>0;}
  update(dt){const e={};this.hitFlash=Math.max(0,this.hitFlash-dt);if(!this.active)return e;if(!this.fullBloom&&this.health<=5000){this.fullBloom=true;this.shield=1000;}if(this.fullBloom&&!this.fullBloomAnnounced){this.fullBloomAnnounced=true;e.fullBloom=true;}
    this.thornTimer-=dt;if(this.thornTimer<=0){this.thornTimer+=3;e.thornLines=this.fullBloom?7:5;}
    this.petalTimer-=dt;if(this.petalTimer<=0&&this.spiralTime<=0){this.petalTimer+=4;this.spiralTime=3;this.spiralVolleyTimer=0;}
    if(this.spiralTime>0){this.spiralTime-=dt;this.spiralVolleyTimer-=dt;const interval=this.fullBloom?.2:.3;if(this.spiralVolleyTimer<=0){this.spiralVolleyTimer+=interval;e.petalVolley={angle:this.spiralAngle,count:3};this.spiralAngle+=.31;}}
    this.pollenTimer-=dt;if(this.pollenTimer<=0){this.pollenTimer+=6;e.pollenBurst={count:6,speed:this.fullBloom?112.5:90};}
    return e;
  }
  takeDamage(amount){if(!this.active)return false;let remaining=Math.max(0,amount);const absorbed=Math.min(this.shield,remaining);this.shield-=absorbed;remaining-=absorbed;this.health=Math.max(0,this.health-remaining);if(!this.fullBloom&&this.health<=5000){this.fullBloom=true;this.shield=1000;}this.hitFlash=.14;return this.health===0;}
  render(c,camera){if(!this.active)return;const x=this.x-camera.x,y=this.y-camera.y;c.save();c.translate(x,y);if(this.shield>0){c.strokeStyle="rgba(255,190,226,.85)";c.lineWidth=8;c.beginPath();c.arc(0,-10,88,0,Math.PI*2);c.stroke();}if(this.fullBloom){c.fillStyle="rgba(255,92,164,.2)";c.beginPath();c.arc(0,-8,105+Math.sin(Date.now()/120)*5,0,Math.PI*2);c.fill();}c.fillStyle="#41773c";c.fillRect(-10,10,20,72);c.fillRect(-50,64,100,14);const petals=this.fullBloom?16:12;const radius=this.fullBloom?55:43;c.fillStyle=this.hitFlash>0?"#fff4df":"#d83d72";for(let i=0;i<petals;i++){const a=i/petals*Math.PI*2;c.save();c.rotate(a);c.fillRect(radius-17,-12,34,24);c.restore();}c.fillStyle="#7d243f";c.beginPath();c.arc(0,0,this.fullBloom?31:26,0,Math.PI*2);c.fill();c.fillStyle="#231b1c";c.fillRect(-72,-108,144,7);c.fillStyle="#f06b8c";c.fillRect(-69,-106,138*(this.health/this.maxHealth),3);if(this.shield>0){c.fillStyle="#572945";c.fillRect(-69,-118,138,5);c.fillStyle="#ffc3df";c.fillRect(-67,-117,134*(this.shield/this.maxShield),3);}c.restore();}
}
