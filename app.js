// Dependenceies

var
	express = require('express'),
	mongoose = require('mongoose'),
	Redmine = require('./lib/redmine'),
	cons = require('consolidate'),
        swig = require('swig'),
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

db = mongoose.connect('mongodb://localhost/bugtracker');
mongoose.connection.on('error', function (err) {
        console.error('MongoDB error: ' + err.message);
        console.error('Make sure a mongoDB server is running and accessible by this application')
});


// Connect to model

var bugSnapshotSchema = new mongoose.Schema({
        created_at : {type: Date, default: Date.now},
        count : Number
});

var BugSnapshot = db.model('bugSnapshot', bugSnapshotSchema);

// Launch periodic poll

var delay = parseInt(0.5*60*60*1000); // every 1/2 hour
var timer = setInterval(lookForIssues, delay);
function lookForIssues(){
	console.log('looking for currrent issues ...');
        redmine.getIssues({query_id: "640"}, function(err, data) {
                if (err) {
                        console.log("Error: " + err.message);
                        // stop timer
                        clearInterval(timer);
                        return;
                }
                var snap = new BugSnapshot({count : data.total_count});
                snap.save(function(err){
                        if (err) throw new Error('Woooops');
                        console.log(' |-> nb of issues : ' + data.total_count);
                });
        });
}
// look for issues on app start
lookForIssues();

// Routes

app.get('/last/minute', function(req, res) {
	queryIssuesOfLast('minute', function(snaps){
		res.render('playground.html', {snaps : snaps});
	});
});

app.get('/last/hour', function(req, res){
	queryIssuesOfLast('hour', function(snaps){
                res.render('playground.html', {snaps : snaps});
        });
});

app.get('/last/day', function(req, res){
        queryIssuesOfLast('day', function(snaps){
                res.render('playground.html', {snaps : snaps});
        });
});

app.get('/last/week', function(req, res){
       	queryIssuesOfLast('week', function(snaps){
                res.render('playground.html', {snaps : snaps});
        });
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

        var query = {
                "created_at" : {"$gte": new Date(sinceDate)}
        };

        BugSnapshot.find(query, function(err, snaps){

                if(err) throw new Error("mmm :(");
		
		next(snaps);

        });

}

// App server start

app.listen(8001, function(){
	console.log("Express server listening on port %d in %s mode", 8001, app.settings.env);
});
