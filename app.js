// Dependencies

var
	express = require('express'),
	mongoose = require('mongoose'),
	cons = require('consolidate'),
	swig = require('swig'),
	conf = require('./conf')
;

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

// Expose model interface

var BugSnapshot = db.model('bugSnapshot', bugSnapshotSchema);

// Launch periodic poll

require('./poller')(BugSnapshot);

// Routes

require('./routes')(app, BugSnapshot);

// App server start

app.listen(conf.app.port, function(){
	console.log("Express server listening on port %d in %s mode", conf.app.port, app.settings.env);
});
