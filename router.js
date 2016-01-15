var general  = require('./routes/general.js');
var token    = require('./routes/token.js');
var user     = require('./routes/user.js');

module.exports.setup = function(app) {
	app.get(   '/',                                     general.apiVersion);

	app.get(   '/token/:token',                         token.retrieveData);
	app.delete('/token/:token',                         token.revoke);

	app.get(   '/validity/:token',                      token.validity);

	app.post(  '/user',                                 user.create);
	app.post(  '/user/validate/:code',                  user.validate);
	app.get(   '/user/:username',                       user.temporaryAuthentication);
	app.post(  '/user/:username',                       user.authenticate);
	app.put(   '/user/:username/:password',             user.update);
	app.delete('/user/:username/:password',             user.delete);
};

/*
/user
	GET 	return an auth token (or temp user)
	POST 	create an user
	PUT 	update the user account
	DELETE 	delete the user

/token
	GET 	convert a token into data
	POST 	N/A
	PUT 	N/A
	DELETE 	revoke
*/
