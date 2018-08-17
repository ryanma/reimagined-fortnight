var actions = require('action.pick_source');

const STATE_GATHERING = "gathering";
const STATE_UPGRADING = "upgrading";

var checkStateMachine = function(creep) {
    if(![STATE_GATHERING, STATE_UPGRADING].includes(creep.memory.state)) {
        creep.memory.state = STATE_GATHERING;
    }

    if(creep.memory.state == STATE_UPGRADING && creep.carry.energy == 0) {
        creep.memory.upgrading = false;
        creep.memory.state = STATE_GATHERING;
        creep.say('harvest');
    }
    if(creep.memory.state == STATE_GATHERING && creep.carry.energy == creep.carryCapacity) {
        creep.memory.upgrading = true;
        creep.memory.state = STATE_UPGRADING;
        creep.say('upgrade');
    }
};

var gatherStateAction = function(creep) {
    var source = actions.pickFilledContainer(creep);
    if(source == null) {
        creep.moveTo(Game.flags['The Cabinet'].pos);
    }
    else if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source.pos, {visualizePathStyle: {stroke: '#ffaa00'}});
    }

};

module.exports = {

    /** @param {Creep} creep **/
    run: function(creep) {
        checkStateMachine(creep);

        if(creep.memory.state == STATE_UPGRADING) {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller, {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else if (creep.memory.state ==  STATE_GATHERING) { gatherStateAction(creep); }
        else {
            throw "upgrader "+ creep.name +  " in a bad state: " + creep.memory.state;
        }

    },
    spawn: function(spawn){
        // spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE], // Ideal Upgrader, 1000 cost total
        spawn.spawnCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE], // Current recipe: 800 energy total
            'upgrader' + Game.time,
            { memory: { role: 'upgrader', memory: STATE_GATHERING } })
    }
};
