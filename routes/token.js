var jwt = require('json-web-token');
var TokenIssuer = require('../lib/TokenIssuer');

module.exports = {
	/**
	 * GET /token/:token
	 * Allow any possessor of a token to retrieved data
	 */
	retrieveData: function(req, res) {
		var token = req.params.token;

		TokenIssuer.solveToken(token, function(data, err, decodeErr) {
			if (decodeErr) {
				res.status(500).send({'error': decodeErr});
			} else if (err) {
				res.status(403).send({'error': err});
			} else {
				res.status(200).send(data);
			}
		});
	},
	/**
	 * DELETE /token/:token
	 * Revoke the use of an issued token.
	 */
	revoke: function(req, res) {
		var token = req.params.token;
		TokenIssuer.revoke(token);
		res.status(200).send({'success': true});
	}
};
