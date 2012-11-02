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

var app = module.exports = express();

app.configure(function(){
        app.use(express.bodyParser());
        app.use(express.methodOverride());
        app.use(app.router);
        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

// Configure mongodb, attached to server context

app.dbconnect = mongoose.connect('mongodb://localhost/bugtracker');
mongoose.connection.on('error', function (err) {
        console.error('MongoDB error: ' + err.message);
        console.error('Make sure a mongoDB server is running and accessible by this application')
});

app.get('/', function(req, res) {
	res.end('coucou');
});

app.get('/snapshot', function(req, res){
	redmine.getIssues({query_id: "640"}, function(err, data) {
		if (err) {
			console.log("Error: " + err.message);
			return;
		}
		res.end('nb of issues : ' + data.total_count);
	});
});

app.listen(3000, function(){
	console.log("Express server listening on port %d in %s mode", 3000, 'localhost');
});
