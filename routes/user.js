var Kind = require('../lib/Kind');
var TokenIssuer = require('../lib/TokenIssuer');

// TODO: Add, for each user, the list of issued tokens (with associated app-device/start-date/end-date/)
// and maybe an associated function (with Thread) to clean old tokens?

var users = [
	{
		'username': 'gautier',
		'password': 'gautier',
		'isEmailValid': true,
		'email': 'gautier@gautier',
		'kind': Kind.ADMIN
	},
	{
		'username': 'clement',
		'password': 'clement',
		'isEmailValid': true,
		'email': 'clement@clement',
		'kind': Kind.ADMIN
	},
	{
		'username': 'test',
		'password': 'test',
		'isEmailValid': true,
		'email': 'test@test',
		'kind': Kind.USER
	},
	{
		'username': 'soonvalid',
		'password': 'soonvalid',
		'isEmailValid': false,
		'email': 'soonvalid@soonvalid',
		'kind': Kind.USER
	}
];

var validations = [
	{
		'code': "X",
		'username': 'soonvalid'
	}
];

function getUser(username) {
	for (var id in users)
	{
		var u = users[id];
		if (u.username == username)
			return u;
	}
	return null;
}

function isUsernameFree(username) {
	return getUser(username) == null;
}

module.exports = {
	/**
	 * GET /user/:username
	 * Try to provide a token (with fast expiration) for temporary player
	 */
	temporaryAuthentication: function(req, res) {
		var username = req.params.username;
		if (isUsernameFree(username))
		{
			TokenIssuer.getNewToken(Kind.GUEST, username, function(token, err) {
				if (err) {
					res.status(500).send({'error': err});
				} else {
					res.status(201).send({'token': token});
				}
			});
		}
		else
		{
			res.status(403).send({'error': "Username already used."})
		}
	},
	/**
	 * GET /user/:username/:password
	 * Provide an unique token for an authenticated registered user
	 */
	authenticate: function(req, res) {
		var username = req.params.username;
		var password = req.body.password;

		for (var i in users)
		{
			var user = users[i];
			if (user.username == username)
			{
				if (user.isEmailValid)
				{
					if (user.password == password)
					{
						TokenIssuer.getNewToken(user.kind, user.username, function(token, err) {
							if (err) {
								res.status(500).send({'error': err});
							} else {
								res.status(201).send({'token': token});
							}
						});
						return;
					}
					else
					{
						res.status(403).send({'error': "Wrong password"});
						return;
					}
				}
				else
				{
					res.status(403).send({'error': "Your account isn't activated (validation email)."});
					return;
				}
			}
		}
		res.status(403).send({'error': "Unknown username"});
	},
	/**
	 * POST /user/validate/:code
	 * Validation of the associated account (UUID sent by mail)
	 */
	validate: function(req, res) {
		var code = req.params.code;
		for (var i in validations)
		{
			var validInfo = validations[i];
			if (validInfo.code == code)
			{
				getUser(validInfo.username).isEmailValid = true;
				res.status(200).send({'success': true});
				validations.splice(i, 1);
				return;
			}
		}
		res.status(403).send({'error': 'Provided validation code is not valid.'});
	},
	/**
	 * POST /user
	 * in-body parameters expected: username, password, email
	 * Interface who allows to register an account.
	 * It's possible to register a temporary user but we have to revoke all associated token
	 */
	create: function(req, res) {
		var username = req.body.username;
		var password = req.body.password;
		var email    = req.body.email;

		var free = true;
		for (var offset = 0 ; offset < users.length ; offset++)
		{
			var user = users[offset];
			if (email == user.email || username == user.username)
			{
				free = false;
				break;
			}
		}

		if (free) {
			users.push({
				'username': username,
				'password': password,
				'isEmailValid': false,
				'email': email,
				'kind': Kind.USER
			});
			res.status(201).send({'success': true});
		} else {
			res.status(403).send({'error': "Username or email already used."});
		}
	},
	/**
	 * PUT /user/:username/:password
	 * in-body parameters expected: email
	 * Updating an account, require to validate again.
	 */
	update: function(req, res) {
		var username = req.params.username;
		var password = req.params.password;
		var email    = req.body.email;

		for (var id in users)
		{
			var user = users[id];
			if (user.username == username && user.password == password)
			{
				user.isEmailValid = false;
				user.email = email;
				// TODO: revoke associated tokens
				res.status(200).send({'success': true});
				return;
			}
		}

		res.status(403).send({'error': "Authentication failure"});
	},
	/**
	 * DELETE /user/:username/:password
	 * Deletion of an account
	 */
	delete: function(req, res) {
		var username = req.params.username;
		var password = req.params.password;

		res.status(404).send({'error': "Feature not implemented."});
	}
};
