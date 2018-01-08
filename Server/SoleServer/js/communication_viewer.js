module.exports = {

	fincUser: function (port){
	    for(var i=0; i<streamers.length;i++){
	        if(streamers[i] == undefined)
	            continue;
	        else if(streamers[i].port == port){
	            return streamers[i];
	        }
	    }
	},

	parseQuery: function (query){
	    var pattern = /[a-z]*=[a-z0-9]*/i;
	    var parsedQuery = pattern.exec(query);
	    var obj = {};
	    for(var i = 0; i < parsedQuery.length; i++){
	        var split = parsedQuery[i].split('=');
	        obj[split[0].trim()] = split[1].trim();
	    }

	    return obj;
	}
}