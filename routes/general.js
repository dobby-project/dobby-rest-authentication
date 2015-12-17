var API_version = '1.0';

module.exports = {
	apiVersion: function(req, res) {
		res.status(200).send({'API Version': API_version});
	}
}
