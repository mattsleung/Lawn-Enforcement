import test from "node:test";
import assert from "node:assert/strict";
import { MAP_SLOTS, mapById } from "../src/config/map-config.js";
import { MountainGoat, MountainEagle, MountainRam } from "../src/entities/mountain-trail-enemies.js";
import { MountainRock } from "../src/entities/mountain-rock.js";
import { BillyMountainKingBoss } from "../src/entities/billy-mountain-king-boss.js";

test("Mountain Trail follows Campground with hazards and a 100-enemy cap",()=>{const map=mapById("mountain-trail");assert.equal(MAP_SLOTS.at(-3),map);assert.equal(map.world.width/1280,1.8);assert.equal(map.world.height/720,1.8);assert.equal(map.enemyCap,100);assert.equal(map.boulderEntries.length,6);assert.equal(map.boss.health,32000);});
test("Mountain Trail makes Acorn Squirrels common and doubles its rare enemies' health",()=>{const map=mapById("mountain-trail"),world={width:1000,height:800};assert.equal(map.mountainSpawnWeights.acornSquirrel,.71);assert.equal(map.mountainSpawnWeights.goat,.12);assert.equal(map.mountainSpawnWeights.eagle,.12);assert.equal(map.mountainSpawnWeights.ram,.05);assert.equal(new MountainGoat({x:0,y:0,world}).health,1600);assert.equal(new MountainEagle({x:0,y:0,world}).health,1400);assert.equal(new MountainRam({x:0,y:0,world}).health,3600);});
test("mountain rocks carry asymmetric friendly-fire damage",()=>{const rock=new MountainRock({x:0,y:0,velocityX:10,velocityY:0,playerDamage:40,enemyDamage:850});assert.equal(rock.playerDamage,40);assert.equal(rock.enemyDamage,850);});
test("Billy enters King of the Mountain below 8000 health",()=>{const map=mapById("mountain-trail"),boss=new BillyMountainKingBoss({x:400,y:300,config:map.boss,world:map.world});boss.health=7999;assert.equal(boss.update(.01,{x:500,y:300}).kingPhase,true);assert.equal(boss.finalPhase,true);assert.equal(boss.maxHealth,32000);});
