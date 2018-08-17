var actions = require('action.pick_source');

const STATE_BUILDING = "building";
const STATE_GATHERING = "gathering";

const CONSTRUCTION_PRIORITIES = [
    STRUCTURE_TOWER,
    STRUCTURE_WALL,
    STRUCTURE_EXTENSION,
    STRUCTURE_CONTAINER,
    STRUCTURE_ROAD
];

var checkStateMachine = function(creep){
    if (![STATE_BUILDING, STATE_GATHERING].includes(creep.memory.state)) {
        creep.memory.state = STATE_GATHERING;
    }

    if((creep.memory.state == STATE_BUILDING || creep.memory.building)
        && creep.carry.energy == 0) {
        creep.memory.building = false;
        creep.memory.state = STATE_GATHERING;
        creep.memory.containerSource = null;
        creep.say('🔄 harvest');
    }

    if(!creep.memory.building && creep.carry.energy == creep.carryCapacity) {
        creep.memory.building = true;
        creep.memory.state = STATE_BUILDING;
        creep.say('🚧 build');
    }
};

var comparePriorities = function(siteA, siteB) {
    indexA = CONSTRUCTION_PRIORITIES.indexOf(siteA.structureType);
    indexB = CONSTRUCTION_PRIORITIES.indexOf(siteB.structureType);
    if (indexA == indexB) {
        return (siteA.progressTotal - siteA.progress) - (siteB.progressTotal - siteB.progress);
    }
    return indexA - indexB;
};

var build = function(creep) {
    var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
    targets.sort(comparePriorities);
    if(targets.length) {
        if(creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
            creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    } else {
        // Building is done, get out of the way
        creep.moveTo(Game.flags['The Cabinet'].pos);
    }
};

var gather = function(creep){
    var source = actions.pickFilledContainer(creep);
    
    if(source == null || source.energy < 100) {
        creep.moveTo(Game.flags['The Cabinet']);
    }
    else if(creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        creep.moveTo(source.pos, {visualizePathStyle: {stroke: '#ffaa00'}});
    }

};

module.exports = {
    /** @param {Creep} creep **/
    run: function(creep) {
        checkStateMachine(creep);

        if(creep.memory.state == STATE_BUILDING) { build(creep); }
        else if (creep.memory.state == STATE_GATHERING) { gather(creep); }
        else { throw "builder creep in a bad state: " + creep.name +":"+creep.memory.state; }
    },
    /** @param {Spawn} spawn **/
    spawn: function(spawn){
        // spawn.spawnCreep([WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE], //ideal recipe?
        spawn.spawnCreep([WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE],
            'builder' + Game.time,
            { memory: { role: 'builder', state: STATE_GATHERING } })
    }
};
