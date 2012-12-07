// Dependencies

var 
	Q = require('q'),
	async = require('async')
;

// Routes

module.exports = function(app, Model){

	Model = Model;
	
	app.get('/', function(req, res){ res.redirect('/last/repartition'); });
	
	app.get('/last/repartition', function(req, res){
		queryLastRepartition()
			.then(function(stats){ res.render('piechart.html', {stats : stats}); })
			.fail(console.warn)
		;
	});
	
	app.get('/last/month', function(req, res){
	    queryIssuesOfLast('month')
	    	.then(function(snaps){ res.render('timeline.html', {snaps : snaps}); })
	    	.fail(console.warn)
	    ;
	});
	
	app.get('/last/month/stacked', function(req, res){
	
	    queryIssuesOfLast('month')
	    	.then(function(snaps){ 
	    		
	    		getIssuesByNameArr(snaps)
	    			.then(fillInEmptyKeys)
	    			.then(getIssuesArrByNames)
	    			.then(formatToArray)
	    			.then(function(datas){
		    			res.render('timeline-stacked.html', {datas : datas}); 
	    			});
	    	})
	    	.fail(console.warn)
	    ;
	    
	});
	
	
	// Helpers
	
	function formatToArray(IssuesArrByNames){
		
		//	render
		//	[
		//		{
		//			name : 'name',
		//			data : [counts]
		// 		},
		//		...
		//	]
		//
		//	from
		//	{
    	//		name1 : [countA, countC, ...],
    	//		name2 : [countB, countD, ...],
    	//		...
    	//	}
    	
    	var 
    		deferred = Q.defer(),
    		newFormatArray = []
    	;
    	
    	for(var property in IssuesArrByNames){
	    	
	    	newFormatArray.push({
		    	name : property,
		    	data : IssuesArrByNames[property]
	    	});
	    	
    	}
    	
    	deferred.resolve(newFormatArray);
    	
    	return deferred.promise;
		
	}
	    
    function getIssuesArrByNames(issuesByNameArr){
	  
	    //	renders
    	//	{
    	//		name1 : [countA, countC, ...],
    	//		name2 : [countB, countD, ...],
    	//		...
    	//	}
    	
    	var 
    		deferred = Q.defer(),
    		issuesSequenceByName = {}
    	;
    	
    	async.forEach(issuesByNameArr,
    		function(issuesCountsByName, cb){
	    		
	    						    	
	    		for (var property in issuesCountsByName){
	    			if (issuesSequenceByName[property] != undefined ){
	    				issuesSequenceByName[property].push(issuesCountsByName[property] ? issuesCountsByName[property] : 0) 
	    			} else {
	    				issuesSequenceByName[property] = [];
	    			}
	    		}
	    		
	    		cb();
	    		
    		}, function(err){
    			if(err) deferred.reject(new Error("arf !"));
    			deferred.resolve(issuesSequenceByName);
    		}
    	
    	);
    	
    	return deferred.promise;
		
		
	}
	
	function fillInEmptyKeys(issuesByNameArr){
		
		//	renders
    	//	[
    	//		{
    	//			name1 : countA,
    	//			name2 : countB
    	//		},
    	//		{
    	//			name1 : countC,
    	//			name2 : countD
    	//		}
    	//	]
    	
    	//	from
    	//	[
    	//		{
    	//			name1 : countA
    	//		},
    	//		{
    	//			name2 : countD
    	//		}
    	//	]
    	
    	var 
    		deferred = Q.defer(),
    		keys = []
    	;
    	
    	// get all keys on collection
    	
    	async.forEach(issuesByNameArr,
    	
    		function(item, cb){
	    		for (var property in item){ 
	    			var containsProperty = keys.some(function(a){return a == property});
	    			if (!containsProperty) keys.push(property);
	    		}
	    		cb();
    		},
    		
    		function(err){
	    		
	    		async.forEach(issuesByNameArr,
	    		
	    			function(issuesByName, cb){
	    				var i = 0, len = keys.length;
	    				for (; i < len; i++){ if( !issuesByName[ keys[i] ] ) issuesByName[keys[i]] = 0; }
	    				cb();
		    		},
		    		
		    		function(err){}
		    		
	    		);
	    		
	    		if(err) deferred.reject(new Error("arf !"));
		    	deferred.resolve(issuesByNameArr);
	    		
    		}
    	
    	);
    	
    	return deferred.promise;
		
	}
    
    function getIssuesByNameArr(snaps){
    
    	//	renders
    	//	[
    	//		{
    	//			name1 : countA,
    	//			name2 : countB
    	//		},
    	//		{
    	//			name1 : countC,
    	//			name2 : countD
    	//		}
    	//	]
    
    	var 
    		deferred = Q.defer(),
    		issuesByNameArr = []
    	;
    
	    async.forEach(snaps, 
			function(snap, cb){
    			getIssuesByName(snap.issues)
	    			.then(function(issuesByName){ issuesByNameArr.push(issuesByName); })
	    			.then(cb)
	    			.fail(console.warn)
	    		;
			}, function(err){
				if(err) deferred.reject(new Error("arf !"));
    			deferred.resolve(issuesByNameArr);
			}
		);
		
		return deferred.promise;
		
    }
    
    function getIssuesByName(issues){ 
    
	    //	renders 
	    //	{
	    //		name1 : countA, 
	    //		name2 : countB,
	    //		...
	    //	}
	    
    	var
    		deferred = Q.defer(),
			name = '',
			coll = {}
		;
		
		async.forEach(issues,
			function(issue, cb){
				
				name = issue.assigned_to.name;
				count = coll[name];
    			coll[name] = (count === undefined) ? 1 : count + 1;
				cb();
				
			}, function(err){
			
				if(err) deferred.reject(new Error("arf !"));
				deferred.resolve(coll);
				
			}
		);
		
		return deferred.promise;
		
    }

	function queryLastRepartition(){
	
		var deferred = Q.defer();
	
		var query = Model
			.find()
			.limit(1)
			.sort("-created_on")
		;
		
		query.exec(function(err, snaps){
				
	       	if(err) throw new Error("mmm :-/");
			
			var 
				snap = snaps[0],
				index = 0,
				stats = {},
				cb = function(){}
			;		
	
			async.forEach(snap.issues,
				function(issue, cb){
					if(!stats[issue.assigned_to.name]) stats[issue.assigned_to.name] = {count: 0, name : issue.assigned_to.name};
					stats[issue.assigned_to.name].count++;
					cb();
				}, function(err){
					if(err) deferred.reject(new Error("arf !"));
					deferred.resolve(stats);
				}
			);
	
		});
		
		return deferred.promise;
	}
	
	var timeUnitValue = (function(){
		var one = {};
		one.minute	= 60 * 1000;
		one.hour	= 60 * one.minute;
		one.day 	= 24 * one.hour;
		one.week 	= 7 * one.day;
		one.month	= 4 * one.week;
		return one
	}());
	
	function queryIssuesOfLast(periodUnit){
	
		var deferred = Q.defer();
	
		var 
			currentTime = Date.now(),
	    	sinceDate = currentTime - timeUnitValue[periodUnit]
	    ;
	
	    var query = Model
	    	.find({ "created_on" : {"$gte": new Date(sinceDate)} })
	    	.sort("created_on")
	    ;
	    
	    query.exec(function(err, snaps){
	        if(err) deferred.reject(new Error("Issue occured when querying db :("));
	        deferred.resolve(snaps);
	    });
	    
	    return deferred.promise;
	
	}	

}