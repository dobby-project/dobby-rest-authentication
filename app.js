var logger = require('node-simple-logger');

var express    = require('express');
var bodyParser = require('body-parser');
var apidocs    = require('express-api-docs');

var config = {
	'file': './router.js',
	'docPath': './api.html',
	'port': 3689
};

// Starting a new express instance
var app = express();

// Configuration the express app to read body
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({extended:false})); // to support URL-encoded bodies

// Add routes to express
var routes = require(config.file);
routes.setup(app);

// Generating API documentation
apidocs.generate(config.file, config.docPath);

// Opening the API
app.listen(config.port, 'localhost', function() {
	logger.info('Listening at port '+config.port);
});
