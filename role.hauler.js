var actions = require('action.pick_source');

const STATE_HAULING = "hauling";
const STATE_FINDING = "finding";

var checkStateMachine = function(creep){
    if(![STATE_HAULING, STATE_FINDING].includes(creep.memory.state)) {
        creep.memory.state = STATE_FINDING;
    }

    if(creep.memory.state == STATE_FINDING && creep.carry.energy == creep.carryCapacity) {
        creep.memory.state = STATE_HAULING;
        creep.memory.haulTargetId = null;
        creep.say('🚧 hauling');
    }
    if(creep.memory.state == STATE_HAULING && creep.carry.energy == 0) {
        creep.memory.state = STATE_FINDING;
        creep.memory.containerSource = null;
        creep.say('🔄 finding');
    }
};

var findStateAction = function(creep) {
    source = actions.pickHaulerSource(creep);

    if(!source) {
        creep.memory.containerSource = null;
        // console.log('hauler. no sources. moving away');
        creep.moveTo(Game.flags['The Cabinet'].pos);
        creep.memory.containerSource = null;
    }
    result = creep.withdraw(source, RESOURCE_ENERGY);
    if(result == ERR_INVALID_TARGET) {
        result = creep.pickup(source);
    }
    if(result == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
    }

};

var haulStateAction = function(creep){
    var target = findHaulTarget(creep);
    if (target) { 
        var result = creep.transfer(target, RESOURCE_ENERGY);
        // console.log(result);
        if(result == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
        } else if (result == ERR_FULL) {
            creep.memory.haulTargetId = null;
            target = findHaulTarget(creep);
        }

    } else { creep.moveTo(Game.flags['The Cabinet']); }
};

var findHaulTarget = function(creep) {
    if (creep.memory.haulTargetId){
        target = Game.getObjectById(creep.memory.haulTargetId);
        if (target.structureType == STRUCTURE_CONTAINER && target.store[RESOURCE_ENERGY] < target.storeCapacity ||
            target.energy < target.energyCapacity) { return target; }
    }

    target = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (_.includes([STRUCTURE_SPAWN, STRUCTURE_EXTENSION], structure.structureType) && structure.energy < structure.energyCapacity) }
    })[0];

    if (!target) {
        target = creep.room.find(FIND_STRUCTURES,
            { filter: (str) => {
                return (str.structureType == STRUCTURE_TOWER && str.energy < str.energyCapacity)
            } })[0];
    }

    if (!target) { target = Game.getObjectById(Memory.dumpContainerId); }
    creep.memory.haulTargetId = target.id;
    return target;
};

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {

        checkStateMachine(creep);

        if(creep.memory.state == STATE_FINDING) { findStateAction(creep); }
        else if (creep.memory.state == STATE_HAULING) { haulStateAction(creep); }
        else { throw creep.name+" in a bad state: "+creep.memory.state }
    },
    spawn: function(spawn) {
        // spawn.spawnCreep([CARRY,CARRY,MOVE],
        spawn.spawnCreep([CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
            'hauler' + Game.time,
            { memory: { role: 'hauler', state: STATE_FINDING } })
    }
};
