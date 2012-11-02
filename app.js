// Dependenceies

var
	express = require('express'),
	mongoose = require('mongoose'),
	Redmine = require('./lib/redmine'),
	cons = require('consolidate'),
        swig = require('swig')
;

var redmine = new Redmine({
	host : "redmine.viadeobackoffice.com",
	apiKey : "f2cddb4e9ca3cce7f19812d42a6cc2f985259017" 
});


// App config

var app = module.exports = express();

app.configure(function(){
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
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

var delay = parseInt(60*60*1000); // every hour
var timer = setInterval(function(){
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
}, delay);

// Routes

app.get('/', function(req, res) {
	
	res.end('coucou');
});

app.get('/last/hour', function(req, res){
	res.end('last hour');
});

app.get('/last/week', function(req, res){
        res.end('last week');
});

app.get('/last/month', function(req, res){
        res.end('last month');
});

// App server start

app.listen(3000, function(){
	console.log("Express server listening on port %d in %s mode", 3000, app.settings.env);
});
