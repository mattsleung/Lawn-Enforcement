import test from "node:test";
import assert from "node:assert/strict";
import { MAP_SLOTS, mapById } from "../src/config/map-config.js";
import { beachTideState } from "../src/core/game.js";
import { Crab, HermitCrab, BeachBallEnemy, SandOctopus, Lifeguard } from "../src/entities/beach-enemies.js";
import { KingCrabBoss } from "../src/entities/king-crab-boss.js";

test("Beach follows Botanical Garden with an extreme smooth tide swing",()=>{
  const map=mapById("beach");assert.equal(MAP_SLOTS.at(-5),map);assert.equal(map.enemyCap,100);assert.equal(map.boss.health,25000);
  assert.deepEqual(beachTideState(0),{phase:"low",coverage:.15});assert.equal(beachTideState(50).coverage,.65);
  assert.equal(beachTideState(30).phase,"advancing");assert.equal(beachTideState(70).phase,"retreating");
});

test("Beach enemies expose their requested health and identities",()=>{
  const common={x:100,y:100},world={width:1000,height:700};
  assert.equal(new Crab(common).health,500);assert.equal(new Crab(common).waterImmune,true);
  const hermit=new HermitCrab(common);assert.equal(hermit.health,1200);hermit.hiding=1;hermit.takeDamage(100);assert.equal(hermit.health,1175);
  const ball=new BeachBallEnemy({...common,world});assert.equal(ball.health,300);assert.equal(ball.speed,520);const octopus=new SandOctopus(common);assert.equal(octopus.health,1500);assert.equal(octopus.attackRange,360);octopus.warning=.01;octopus.update(.02,{x:200,y:100});assert.ok(octopus.tentacleVisual>0);assert.equal(new Lifeguard(common).health,750);
});

test("King Crab enrages below 6000 health and gains a true high-tide state",()=>{
  const boss=new KingCrabBoss({x:400,y:300,world:{width:1200,height:800},config:{name:"King Crab",health:25000,speed:150,damage:35}});
  boss.health=5999;boss.highTide=true;boss.update(.1,{x:700,y:300});assert.equal(boss.enraged,true);assert.equal(boss.highTide,true);
  assert.equal(boss.speed,150);
});
