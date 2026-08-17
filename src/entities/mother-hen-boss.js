import { Chicken } from "./chicken-farm-enemies.js";

export class MotherHenBoss extends Chicken {
  constructor({x,y,config,world}){super({x,y});this.config=config;this.world=world;this.name=config.name;this.radius=62;this.maxHealth=config.health;this.health=config.health;this.speed=config.speed;this.damage=35;this.isBoss=true;this.enemyType="mother-hen";this.eggTimer=3;this.rushTimer=6;this.wingTimer=5;this.eggWindup=0;this.eggTargets=[];this.wingWindup=0;this.wingTarget=null;}
  update(dt,target){
    this.tick(dt);const enraged=this.health<4000;const events={enraged};
    if(this.eggWindup>0){this.eggWindup-=dt;if(this.eggWindup<=0){events.tossEggs=this.eggTargets;this.eggTargets=[];this.eggTimer=3;}}
    else {this.eggTimer-=dt;if(this.eggTimer<=0){const count=enraged?4:3;this.eggTargets=Array.from({length:count},(_,index)=>{const angle=index/count*Math.PI*2;const distance=75+index%2*45;return{x:target.x+Math.cos(angle)*distance,y:target.y+Math.sin(angle)*distance};});this.eggWindup=.7;}}
    if(this.wingWindup>0){this.wingWindup-=dt;if(this.wingWindup<=0){events.wingBlast={...this.wingTarget,radius:290,arc:1.35,damage:35,pushback:220};this.wingTarget=null;this.wingTimer=enraged?3:5;}}
    else {this.wingTimer-=dt;if(this.wingTimer<=0){this.wingTarget={targetX:target.x,targetY:target.y};this.wingWindup=.8;}}
    this.rushTimer-=dt;if(this.rushTimer<=0){events.chickenRush=enraged?6:4;this.rushTimer=6;}
    const dx=target.x-this.x,dy=target.y-this.y,d=Math.hypot(dx,dy)||1;if(this.eggWindup<=0&&this.wingWindup<=0){this.x+=dx/d*this.speed*(enraged?1.3:1)*dt;this.y+=dy/d*this.speed*(enraged?1.3:1)*dt;}return events;
  }
  render(c,camera){
    const x=Math.round(this.x-camera.x),y=Math.round(this.y-camera.y),enraged=this.health<4000;
    if(this.eggWindup>0){c.strokeStyle="rgba(238,197,75,.9)";c.fillStyle="rgba(238,197,75,.9)";c.lineWidth=3;c.setLineDash([8,7]);for(const target of this.eggTargets){const tx=Math.round(target.x-camera.x),ty=Math.round(target.y-camera.y);c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.strokeRect(tx-16,ty-16,32,32);c.fillRect(tx-3,ty-24,6,14);c.fillRect(tx-3,ty+10,6,14);c.fillRect(tx-24,ty-3,14,6);c.fillRect(tx+10,ty-3,14,6);}c.setLineDash([]);}
    if(this.wingWindup>0&&this.wingTarget){const aim=Math.atan2(this.wingTarget.targetY-this.y,this.wingTarget.targetX-this.x);c.fillStyle="rgba(255,238,180,.2)";c.strokeStyle="rgba(255,224,130,.95)";c.lineWidth=5;c.beginPath();c.moveTo(x,y);c.arc(x,y,290,aim-1.35/2,aim+1.35/2);c.closePath();c.fill();c.stroke();}
    c.save();if(enraged)c.translate((Math.random()-.5)*4,(Math.random()-.5)*4);if(this.wingWindup>0){const flap=Math.sin(this.wingWindup*36)*16;c.fillStyle="#ead9ba";c.fillRect(x-75,y-25-flap,32,54);c.fillRect(x+42,y-25+flap,32,54);}c.fillStyle=this.hitFlash>0?"#fff":enraged?"#f0b174":"#f3ead1";c.fillRect(x-55,y-43,100,83);c.fillRect(x+22,y-68,52,50);c.fillStyle="#d83d35";c.fillRect(x+30,y-82,32,16);c.fillStyle="#efa938";c.fillRect(x+68,y-49,24,12);c.fillStyle="#2a211d";c.fillRect(x+50,y-57,7,7);c.fillStyle="#6c4731";c.fillRect(x-35,y+38,12,22);c.fillRect(x+17,y+38,12,22);c.restore();c.fillStyle="#271f19";c.fillRect(x-70,y-91,140,7);c.fillStyle="#d94739";c.fillRect(x-68,y-89,136*this.health/this.maxHealth,3);
  }
}
