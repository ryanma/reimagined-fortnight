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
    var source = actions.pickSource(creep);
    if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
        

        // Is the creep stuck?
        // if(typeof creep.memory.previousSteps == "undefined") creep.memory.previousSteps = [];
        // creep.memory.previousSteps.unshift({x: creep.pos.x, y: creep.pos.y});
        // creep.memory.previousSteps = creep.memory.previousSteps.slice(0,3);
        //
        // var moved = false;
        // _.each(creep.memory.previousSteps, function(oldPos) {
        //     moved = moved || (creep.pos.x == oldPos.x && creep.pos.y == oldPos.y);
        // });
        //
        // if (!moved) { source = actions.pickSource(creep, { nth: 1 }); }

        creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
    }
};

var carry = function(creep) {
    // if Haulers exist, drop energy into a container. Else, carry it to spawn or extension
    if (_.filter(Game.creeps, (creep) => creep.memory.role == "hauler").length) {
        var target = actions.pickEmptyContainer(creep);
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
