var defineMemoryStructure = function(room) {
	if (typeof Memory.harvesters === "undefined") {
		console.log('overwriting Memory.harvesters');
		Memory.harvesters = {}; }

	if (typeof Memory.harvesters[room.name] === "undefined") {
		var sources = room.find(FIND_SOURCES);
		Memory.harvesters[room.name] = {};
		for(var i = 0, len = sources.length; i < len; i++){
			var source = sources[i];
			console.log("adding this to memory: "+JSON.stringify(source));
			Memory.harvesters[room.name][source.id] = null;
		}
	}
};

var deadCreepCheck = function(room){
	for(var sourceId in Memory.harvesters[room.name]) {
		creepName = Memory.harvesters[room.name][sourceId];
		if(!creepName) { return; }
		if(!Game.creeps[creepName]){
// 			console.log("removing dead harvester from manager. source ",sourceId, " name ", creepName);
			Memory.harvesters[room.name][sourceId] = null;
		}
	}
}

var masterRecipe = [WORK,WORK,WORK,WORK,WORK,CARRY,MOVE];

var spawnFor = function(source) {
	var spawner = Game.spawns['Spawn1'];
	if (spawner.room.energyAvailable < 300) return null;
    var spawned = false;
	var recipe =  masterRecipe.slice();
	var name = "harvester" + Game.time;

	while(!spawned) {
		result = spawner.spawnCreep(recipe, name,
			{ memory: { role: "harvester",
				state: "harvesting",
				harvestSource: source,
				previousSteps: [] }  })

		if (result == OK) { spawned = true; }	
		else if(result == ERR_NOT_ENOUGH_ENERGY) {
			recipe.shift();
			console.log("not enough energy. new recipe: ", recipe)
		}
		else if(result == ERR_NAME_EXISTS) { name = name + "a"; }
		else { console.log("couldn't spawn harvester: ", result) }
	}

	return name;
};

module.exports = {
	/** param {Room} room **/
	run: function(room) {
		// If it doesn't exist, make an object with a room's sources as the keys
		defineMemoryStructure(room);
		
		//check for dead creeps
		deadCreepCheck(room);
		
		// If there is no harvester for a source, spawn a new one and assign it to the empty source (by name)
		for (var source in Memory.harvesters[room.name]) {
// 			console.log("checking source for current harvester: ", source);

			if(!Memory.harvesters[room.name][source]) {
				console.log("source doesn't have a creep: ", source);
				creepName = spawnFor(source);
				Memory.harvesters[room.name][source] = creepName;
				console.log("setting spawned creep for source ", source)
			} 
		}
	}
}
