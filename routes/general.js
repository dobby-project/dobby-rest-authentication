var API_version = '1.0';

module.exports = {
	apiVersion: function(req, res) {
		res.status(200).jsonp({'API Version': API_version});
	}
}
