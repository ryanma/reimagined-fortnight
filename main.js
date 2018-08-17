var roleHarvester = require("role.harvester");
var roleUpgrader = require("role.upgrader");
var roleBuilder = require("role.builder");
var roleHauler = require("role.hauler");
var roleMaintainer = require("role.maintainer");
var roleTower = require("structure.tower");
var harvesterManager = require("manager.harvester");
var actions = require("action.pick_source");

// TODO List
// TODO Hostile Mode
// TODO Hostile Mode: Harvesters. nothing different?
// TODO Hostile Mode: Haulers. Go to tower? Prioritizes defense.
// TODO Hostile Mode: Haulers: Do not approach energy near hostiles!
// TODO Hostile Mode: Builders: Convert to mainainer creeps?
// TODO Hostile Mode: Upgraders: Convert to maintainers? 

var getCreepsWithRole = function(role) {
    var creeps = _.filter(Game.creeps, (creep) => creep.memory.role == role);
    return creeps
};

var soundTheKlaxon = function(room) {
    // sort by number of ranged and attack parts descending
    hostileIds = room.find(FIND_HOSTILE_CREEPS).sort(function(a, b) {
        aAttackParts = a.getActiveBodyparts(ATTACK) + a.getActiveBodyparts(RANGED_ATTACK);
        bAttackParts = b.getActiveBodyparts(ATTACK) + b.getActiveBodyparts(RANGED_ATTACK);
        return bAttackParts - aAttackParts;
    }).map(hostile => hostile.id);

    if(hostileIds.length) {
        Memory.klaxon = true;
        Memory.hostileIds = hostileIds;
        Game.notify("SOUND THE KLAXON! WE'RE UNDER ATTACK!", 5);
    } else { 
        Memory.klaxon = false;
        Memory.hostileIds = [];
    }
};

const ROOM = Game.rooms["W31N54"];

module.exports.loop = function () {
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {

            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }

    soundTheKlaxon(ROOM);

    var creepBindings =
        { 'harvester': { module: roleHarvester, maximum: 2, minimum: 2 },
            'hauler': { module: roleHauler, maximum: 4, minimum: 4 },
            'upgrader': { module: roleUpgrader, maximum: 3, minimum: 1 },
            'builder': { module: roleBuilder, maximum: 1, minimum: 1 },
            'maintainer': { module: roleMaintainer, maximum: 0, minimum: 0 }
        }

    var harvesters = getCreepsWithRole('harvester');
    var builders = getCreepsWithRole('builder');
    var upgraders = getCreepsWithRole('upgrader');
    var haulers = getCreepsWithRole('hauler');
    var maintainers = getCreepsWithRole('maintainer');

    if(Game.time % 50 == 0) { console.log('Harvesters: ' + harvesters.length + ". Builders: " + builders.length + ". Upgraders: " + upgraders.length +". Haulers: " + haulers.length + ". Maintainers: " + maintainers.length +"."); }

    var minimumCreepQuotaSpawning = false;
    var spawn = Game.spawns['Spawn1'];
    // if none in a role, increase that first
    for(var roleName in creepBindings) {
        // if not currently meeting a minimum quota and 
        if(!minimumCreepQuotaSpawning && getCreepsWithRole(roleName).length < creepBindings[roleName].minimum){
            minimumCreepQuotaSpawning = true;
            if (creepBindings[roleName].module.spawn){
                creepBindings[roleName].module.spawn(spawn);
            } else {
                spawn.spawnCreep([WORK,CARRY,CARRY,MOVE],
                    roleName + Game.time,
                    { memory: { role: roleName } })
            }
        }
    }
    // else build to maximum
    // if (spawn.room.energyAvailable > 200 && !minimumCreepQuotaSpawning){
    if (!minimumCreepQuotaSpawning){
        for(roleName in creepBindings) {
            if(!spawn.spawning && getCreepsWithRole(roleName).length < creepBindings[roleName].maximum ){
                // console.log("Spawning a " + roleName + ".");
                if (creepBindings[roleName].module.spawn){
                    creepBindings[roleName].module.spawn(spawn);
                } else {
                    spawn.spawnCreep([WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE],
                        roleName + Game.time,
                        { memory: { role: roleName } });
                }
            }
        }
    }

    if(Game.spawns['Spawn1'].spawning) {
        var spawningCreep = Game.creeps[Game.spawns['Spawn1'].spawning.name];
        Game.spawns['Spawn1'].room.visual.text(
            '???' + spawningCreep.memory.role,
            Game.spawns['Spawn1'].pos.x + 1,
            Game.spawns['Spawn1'].pos.y,
            {align: 'left', opacity: 0.8});
    }

    for(var name in Game.creeps) {

        var creep = Game.creeps[name];
        if (typeof creep.memory.role == "undefined"){
            console.log(creep, creep.memory.role);
        } else {
            creepBindings[creep.memory.role].module.run(creep);
        } 
    }

    tower = ROOM.find(FIND_STRUCTURES,
        { filter: (str) => { return str.structureType == STRUCTURE_TOWER }})[0];
    roleTower.run(tower);
    harvesterManager.run(ROOM);
}
