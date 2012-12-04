// Dependencies

var Q = require('q'),
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
	    	.then(function(snaps){ res.render('playground.html', {snaps : snaps}); })
	    	.fail(console.warn)
	    ;
	    
	});
	
	
	// Helpers

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