var actions = require('action.pick_source');

const STATE_HARVESTING = "harvesting";
const STATE_CARRYING = "carrying"

var checkStateMachine = function(creep){
    if(creep.memory.state == STATE_HARVESTING && creep.carry.energy == creep.carryCapacity) {
        creep.memory.harvesting = false;
        creep.memory.state = STATE_CARRYING;
        creep.memory.previousSteps = [];
        creep.say('?? carrying');
    }
    if(creep.memory.state == STATE_CARRYING && creep.carry.energy == 0) {
        creep.memory.harvesting = true;
        creep.memory.state = STATE_HARVESTING;
        creep.memory.containerSource = null;
        creep.say('?? harvesting');
    }
};

var harvest = function(creep){
    source = Game.getObjectById(creep.memory.harvestSource);
    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
    }
};

var pickEmptyContainer = function(creep) {
    if (!creep.memory.containerSource) {
        var adjContainer = actions.findAdjacentStructure(STRUCTURE_CONTAINER, creep.pos);
        if (!adjContainer) return null;

        creep.memory.containerSource = adjContainer.id;
    }

    return Game.getObjectById(creep.memory.containerSource);
};

var carry = function(creep) {
    // if Haulers exist, drop energy into a container. Else, carry it to spawn or extension
    if (_.filter(Game.creeps, (creep) => creep.memory.role == "hauler").length) {
        var target = pickEmptyContainer(creep);
        if(target &&
            (!creep.pos.isEqualTo(target.pos) && creep.pos.getRangeTo(target) ) < 5 &&
            creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
        } else { creep.drop(RESOURCE_ENERGY); }
    } else {
        var target = creep.room.find(FIND_STRUCTURES, { 
            filter: (structure) => { 
                return (_.includes([STRUCTURE_SPAWN, STRUCTURE_EXTENSION], structure.structureType) && structure.energy < structure.energyCapacity) }
        })[0];

        var result = creep.transfer(target, RESOURCE_ENERGY); 
        if( result == ERR_NOT_IN_RANGE) {
            creep.moveTo(target, {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }
};

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        checkStateMachine(creep);

        if(creep.memory.state == STATE_HARVESTING) { harvest(creep); }
        else if(creep.memory.state == STATE_CARRYING) { carry(creep); }
        else {
            throw creep.name + " is in a bad state: " + creep.memory.state + ". Re-examine the state machine within the role";
        }
    },
    spawn: function(spawn){
        spawn.spawnCreep([WORK,WORK,WORK,CARRY,MOVE],
        // spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,MOVE],
            'harvester' + Game.time,
            { memory: { role: 'harvester', state: STATE_HARVESTING, previousSteps: [] } })
    }
};
