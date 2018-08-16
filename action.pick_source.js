module.exports = {
	/** @param {Creep} creep **/
	pickSource: function(creep, opts) {
		if (!creep.memory.harvestSource) {
			var sources = creep.room.find(FIND_SOURCES);
			var index = opts ? opts.nth : 0
			console.log("choosing the " + index + " closest");
			creep.memory.harvestSource = _.sortBy(sources, s => creep.pos.getRangeTo(s))[index].id;
		}

		return Game.getObjectById(creep.memory.harvestSource);
	},
	/** @param {Creep} creep **/
	pickDroppedEnergy: function(creep) {
		//find nearest largest dropped energy
		dropped = _.sortBy(creep.room.find(FIND_DROPPED_RESOURCES),
			s => creep.pos.getRangeTo(s));
		dropped = _.sortBy(dropped, s => (-1 * s.energy));

		return dropped[0];
	},
	pickFilledContainer: function(creep) {
		var dumpContainer = Game.getObjectById(Memory.dumpContainerId);
		if(dumpContainer.store[RESOURCE_ENERGY] > 50) { return dumpContainer; }

		var fullContainers = creep.room.find(FIND_STRUCTURES, { filter: (str) => { return (str.structureType == STRUCTURE_CONTAINER && str.store[RESOURCE_ENERGY] > 1000) } });
		return fullContainers[0];
	},
	/** @param {Creep} creep **/
	pickHaulerSource: function(creep) {
		if (!creep.memory.containerSource) {
			dropped = _.sortBy(creep.room.find(FIND_DROPPED_RESOURCES),
				s => creep.pos.getRangeTo(s));
// 			dropped = _.sortBy(dropped, s => (-1 * s.energy))[0];
            
            dropped = dropped[0];
            // console.log(dropped);

			if (dropped){ 
				// console.log("dropped energy", dropped);
				creep.memory.containerSource = dropped.id
				return dropped;
			}

			var sources = creep.room.find(FIND_STRUCTURES, { 
				filter: (structure) => { return (structure.structureType == STRUCTURE_CONTAINER
					&& structure.store[RESOURCE_ENERGY] > 50
					&& structure.id != Memory.dumpContainerId) }
			});
			if (sources.length == 0) {
				return null;
			}
			sources.sort(function(a, b) {
				return b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY];
			})
			creep.memory.containerSource = sources[0].id;
		}

		return Game.getObjectById(creep.memory.containerSource);
	},

	/** @param {Creep} creep **/
	// find nearest empty container
	pickEmptyContainer: function(creep) {
		if (!creep.memory.containerSource) {
			var sources = creep.room.find(FIND_STRUCTURES, { 
				filter: (structure) => { 
					return (structure.structureType == STRUCTURE_CONTAINER && structure.store[RESOURCE_ENERGY] < structure.storeCapacity) }
			});
			if(sources.length == 0) return null;
			creep.memory.containerSource = _.sortBy(sources, s => creep.pos.getRangeTo(s))[0].id;
		}

		return Game.getObjectById(creep.memory.containerSource);
	},
	/** @param {Creep} creep **/
	pickRepairTarget: function(creep) {
		if (!creep.memory.repairTarget) {
			var sources = creep.room.find(FIND_STRUCTURES, { 
				filter: (structure) => { return ( structure.hits < structure.hitsMax ) }
			});
			console.log("pickRepairTarget. sortedSorces");
			console.log(sources.sort((a,b) => a.hits - b.hits));
			creep.memory.repairTarget = sources.sort((a,b) => a.hits - b.hits)[0].id;
		}

		return Game.getObjectById(creep.memory.repairTarget);
	}
}
