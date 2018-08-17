var actions = require('action.pick_source');

const STATE_REPAIRING = "repairing";
const STATE_GATHERING = "gathering";

const REPAIR_PRIORITIES = [
    STRUCTURE_TOWER,
    STRUCTURE_RAMPART,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_CONTAINER,
    STRUCTURE_WALL 
];

var comparePriorities = function(strA, strB) {
    indexA = REPAIR_PRIORITIES.indexOf(strA.structureType);
    indexB = REPAIR_PRIORITIES.indexOf(strB.structureType);
    if (indexA == indexB) { 
        return (strA.hits - strA.hitsMax) - (strB.hits - strB.hitsMax);
    }

    return indexA - indexB;
};

var pickRepairTarget = function(creep){
    var sources = creep.room.find(FIND_STRUCTURES, { 
        filter: (structure) => {
            return ( structure.hits < (.5 * structure.hitsMax) &&
				(structure.structureType != STRUCTURE_RAMPART || structure.hits < 100000) &&
                (structure.structureType != STRUCTURE_WALL || structure.hits < 4000))
        }
    });
    return sources.sort(comparePriorities)[0];
};

var checkStateMachine = function(creep){
    if (![STATE_REPAIRING, STATE_GATHERING].includes(creep.memory.state)) {
        creep.memory.state = STATE_GATHERING;
    }

    if((creep.memory.state == STATE_REPAIRING || creep.memory.maintaining) && creep.carry.energy == 0) {
        creep.memory.maintaining = false;
        creep.memory.state = STATE_GATHERING;
        creep.memory.containerSource = null;
        creep.say('🔄 gathering');
    }
    if((creep.memory.state == STATE_GATHERING || !creep.memory.maintaining) && creep.carry.energy == creep.carryCapacity) {
        creep.memory.state = STATE_REPAIRING;
        creep.memory.maintaining = true;
        creep.say('⚡ maintaining');
    }

};

var repairingStateAction = function(creep) {
    var repairTarget = pickRepairTarget(creep);
    if (repairTarget == null) {
        console.log('no repairs to do. moving away');
        creep.memory.maintaining = false;
        creep.moveTo(Game.flags['The Cabinet'].pos);
    } 
    else if(creep.repair(repairTarget) == ERR_NOT_IN_RANGE) {
        result = creep.moveTo(repairTarget.pos, {visualizePathStyle: {stroke: '#ffffff'}});
    }
};

var gatherStateAction = function(creep) {
    var source = actions.pickFilledContainer(creep);
    if(source == null) {
        creep.moveTo(Game.flags['The Cabinet'].pos);
    }
    else if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        result = creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});

    }

};

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        checkStateMachine(creep);

        if(creep.memory.state == STATE_REPAIRING) { repairingStateAction(creep); }
        else if (creep.memory.state == STATE_GATHERING) { gatherStateAction(creep); }
        else { throw creep.name + " in a bad state: "+creep.memory.state; }
    },
    spawn: function(spawn) {
        // spawn.spawnCreep([WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
        spawn.spawnCreep([WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE],
            'maintainer' + Game.time,
            { memory: { role: 'maintainer', state: STATE_GATHERING } });

    }
};
