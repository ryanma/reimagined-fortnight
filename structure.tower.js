const REPAIR_PRIORITIES = [
    STRUCTURE_RAMPART,
    STRUCTURE_TOWER,
    STRUCTURE_EXTENSION,
    STRUCTURE_CONTAINER,
    STRUCTURE_ROAD,
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

var pickRepairTarget = function(tower){
    var sources = tower.room.find(FIND_STRUCTURES, { 
	filter: (structure) => {
	    return ( structure.hits < structure.hitsMax &&
		(structure.structureType != STRUCTURE_RAMPART || structure.hits < 100000) &&
		(structure.structureType != STRUCTURE_WALL || structure.hits < 50000))
	}
    });

    return sources.sort(comparePriorities)[0];
};

module.exports = {
    run: function(tower) {
	if (tower.energy == 0) { return false; }

	var target = Game.getObjectById(Memory.hostileIds[0]);
	if (target){
	    tower.attack(target);
	    return true;
	}

	target = tower.room.find(FIND_MY_CREEPS, { 
	    filter: function(creep) { return creep.hits < creep.hitsMax; }
	}).sort(function(a, b){ a.hits - b.hits })[0];

	if (target){
	    tower.heal(target);
	    return true;
	}

	target = pickRepairTarget(tower);

	if (target){
	    tower.repair(target);
	}
    }
}
