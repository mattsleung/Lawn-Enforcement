export class KingCrabBoss {
  constructor({x,y,config,world}){Object.assign(this,{x,y,world,config});this.name=config.name;this.health=this.maxHealth=config.health;this.speed=config.speed??150;this.damage=config.damage??35;this.radius=78;this.isBoss=true;this.enemyType="king-crab";this.hitFlash=0;this.slowTime=0;this.freezeTime=0;this.slamTimer=4;this.chargeTimer=7;this.bubbleTimer=5;this.slamWarning=0;this.chargeWarning=0;this.chargeTime=0;this.facing=1;}
  get active(){return this.health>0;}
  takeDamage(amount){this.health=Math.max(0,this.health-Math.max(0,amount));this.hitFlash=.12;return this.health===0;}
  update(dt,target){this.hitFlash=Math.max(0,this.hitFlash-dt);const events={};if(!this.active)return events;const enraged=this.health<6000,rate=this.highTide?1.25:1;this.enraged=enraged;
    if(this.slamWarning>0){this.slamWarning-=dt;if(this.slamWarning<=0)events.clawSlam={radius:105,damage:70,pushback:150};}
    if(this.chargeWarning>0){this.chargeWarning-=dt;if(this.chargeWarning<=0){this.chargeTime=1.35;this.chargeVelocityX=this.facing*1050;this.chargeVelocityY=0;}}
    if(this.chargeTime>0){this.chargeTime-=dt;this.x+=this.chargeVelocityX*dt;this.y+=this.chargeVelocityY*dt;this.damage=55;events.tidalTrail={x:this.x,y:this.y,width:140,lifetime:6};if(this.x<this.radius||this.x>this.world.width-this.radius){this.chargeTime=0;this.x=Math.max(this.radius,Math.min(this.world.width-this.radius,this.x));}}
    else {this.damage=35;const boost=this.highTide?1.5:1,dx=target.x-this.x,dy=target.y-this.y;
      // Tidal Charge travels horizontally, so King Crab deliberately matches
      // the player's lane while continuing its characteristic sideways crawl.
      this.facing=dx>=0?1:-1;
      this.x+=this.facing*this.speed*.42*boost*dt;
      if(Math.abs(dy)>8)this.y+=Math.sign(dy)*this.speed*1.45*boost*dt;
      this.x=Math.max(this.radius,Math.min(this.world.width-this.radius,this.x));
      this.y=Math.max(this.radius,Math.min(this.world.height-this.radius,this.y));}
    this.slamTimer-=dt*rate;if(this.slamTimer<=0&&this.slamWarning<=0){this.slamTimer=enraged?3:4;this.slamWarning=.65;events.clawWarning=true;}
    this.chargeTimer-=dt*rate;if(this.chargeTimer<=0&&this.chargeWarning<=0&&this.chargeTime<=0){this.chargeTimer=enraged?5:7;this.chargeWarning=.7;events.chargeWarning={direction:this.facing};}
    this.bubbleTimer-=dt*rate;if(this.bubbleTimer<=0){this.bubbleTimer=5;events.bubbles={count:enraged?12:8,angle:Math.atan2(target.y-this.y,target.x-this.x)};}
    return events;}
  render(c,cam){if(!this.active)return;const x=this.x-cam.x,y=this.y-cam.y;c.save();c.translate(x,y);if(this.highTide){c.fillStyle="rgba(141,225,255,.28)";c.beginPath();c.arc(0,0,98,0,Math.PI*2);c.fill();}if(this.enraged){c.strokeStyle="#ffda55";c.lineWidth=7;c.beginPath();c.arc(0,0,93+Math.sin(Date.now()/80)*5,0,Math.PI*2);c.stroke();}c.fillStyle=this.hitFlash?"#fff2cf":"#bb3e35";c.fillRect(-65,-35,130,75);c.fillRect(-112,-48,45,42);c.fillRect(67,-48,45,42);c.fillStyle="#e45b45";c.fillRect(-100,35,38,15);c.fillRect(62,35,38,15);c.fillStyle="#21191a";c.fillRect(-27,-45,12,12);c.fillRect(15,-45,12,12);c.fillStyle="#21191a";c.fillRect(-80,-112,160,8);c.fillStyle="#ef6c57";c.fillRect(-77,-110,154*this.health/this.maxHealth,4);c.restore();}
}
