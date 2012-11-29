// Dependencies

var
	express = require('express'),
	mongoose = require('mongoose'),
	Redmine = require('./lib/redmine'),
	cons = require('consolidate'),
        swig = require('swig'),
	async = require('async'),
	conf = require('./conf')
;

var redmine = new Redmine(conf.redmine);


// App config

var app = module.exports = express();

app.configure(function(){

	app.set('views', __dirname + '/views');
        app.engine('html', cons.swig);

	app.use(express.static(__dirname + '/static'));

        app.use(express.logger());
        app.use(express.cookieParser());

        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('development', function(){
        swig.init({ root: __dirname + '/views', allowErrors: true, cache: false });
});

app.configure('production', function(){
        swig.init({ root: __dirname + '/views', allowErrors: true, cache: true });
	app.use(express.errorHandler());
});

// Configure mongodb, attached to server context

db = mongoose.connect(conf.app.mongodb);
mongoose.connection.on('error', function (err) {
        console.error('MongoDB error: ' + err.message);
        console.error('Make sure a mongoDB server is running and accessible by this application')
});


// Connect to model

var bugSnapshotSchema = new mongoose.Schema({
        created_on : {type: Date, default: Date.now},
        count : Number,
	issues : Object
});

var BugSnapshot = db.model('bugSnapshot', bugSnapshotSchema);

// Launch periodic poll

var delay = parseInt(0.5*60*60*1000); // every 1/2 hour
var timer = setInterval(lookForIssues, delay);
function lookForIssues(){
	console.log('looking for currrent issues ...');
        redmine.getIssues({query_id: "640", limit : "100"}, function(err, data) {
                if (err) {
                        console.log("Error: " + err.message);
                        // stop timer
                        clearInterval(timer);
                        return;
                }
                var snap = new BugSnapshot({
			count : data.total_count,
			issues : data.issues
		});
                snap.save(function(err){
                        if (err) throw new Error('Woooops');
                        console.log(' |-> nb of issues : ' + data.total_count);
                });
        });
}
// look for issues on app start
//lookForIssues();

// Routes

app.get('/', function(req, res){ res.redirect('/last/repartition'); });

app.get('/last/repartition', function(req, res){
	BugSnapshot
		.find()
		.limit(1)
		.sort("-created_on")
		.exec(function(err, snaps){
			
           		if(err) throw new Error("mmm :(");
			
			var snap = snaps[0];
			var index = 0;
			var stats = {};
			var cb = function(){};		

			async.forEach(snap.issues,
				function(issue, cb){
					if(!stats[issue.assigned_to.name]) stats[issue.assigned_to.name] = {count: 0, name : issue.assigned_to.name};
					stats[issue.assigned_to.name].count++;
					cb();
				}, function(err){
					if(err) throw new Error("arf !");
					res.render('piechart.html', {stats : stats});
				}
			);

		})
	;



});

app.get('/last/month', function(req, res){
        queryIssuesOfLast('month', function(snaps){
                res.render('playground.html', {snaps : snaps});
        });
});

function queryIssuesOfLast(period, next){

	var currentTime = Date.now();
	
	var one = {
		minute	: parseInt(60 * 1000),
		hour	: parseInt(60 * 60 * 1000),
		day 	: parseInt(24 * 60 * 60 * 1000),
		week 	: parseInt(7 * 24 * 60 * 60 * 1000),
		month	: parseInt(4 * 7 * 24 * 60 * 60 * 1000)
	};
	
    var sinceDate = currentTime - one[period];

    var q = BugSnapshot
    	.find({ "created_on" : {"$gte": new Date(sinceDate)} })
    	.sort("created_on")
    ;
    
    q.exec(function(err, snaps){
        if(err) throw new Error("mmm :(");
        next(snaps);
    });

}

// App server start

app.listen(conf.app.port, function(){
	console.log("Express server listening on port %d in %s mode", conf.app.port, app.settings.env);
});
