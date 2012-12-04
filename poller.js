var 
	Redmine = require('./lib/redmine'),
	conf = require('./conf')
;

module.exports = function(Model){

	var 
		redmine = new Redmine(conf.redmine),
		delay = parseInt(0.5*60*60*1000); // every 1/2 hour
		timer = setInterval(lookForIssues, delay)
	;
	
	
	function lookForIssues(){
	
		console.log('looking for currrent issues ...');
		
	    redmine.getIssues({query_id: "640", limit : "100"}, function(err, data) {
	        
	        if (err) {
	                console.log("Error: " + err.message);
	                // stop timer
	                clearInterval(timer);
	                return;
	        }
	        
	        var snap = new Model({
				count : data.total_count,
				issues : data.issues
			});
			
	        snap.save(function(err){
	                if (err) throw new Error('Woooops');
	                console.log(' |-> nb of issues : ' + data.total_count);
	        });
	        
	    });
	}

}