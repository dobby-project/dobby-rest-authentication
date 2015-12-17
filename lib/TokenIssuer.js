var logger = require('node-simple-logger');

var jwt = require('json-web-token');
var config = require('../config');
var Kind = require('./Kind');


/**
 * TokenIssuer class, provide a context to create and solve safely the JWT
 */
function TokenIssuer() {
	this.issuedTokens = 0;
	this.validUUIDs = [];
}


var tokenIssuer = new TokenIssuer();
module.exports = tokenIssuer; 


/**
 * Date helper, provide a Date instance who represents NOW+1 month.
 * @return {Date}
 */
function nextMonth() {
	var myDate = new Date();
	myDate.setMonth(myDate.getMonth() + 1);
	return myDate;
}

/**
 * Provide a correct token for a token's kind specified
 * @param  {Kind kind}
 * @param {String specific identification}
 * @return {String token}
 */
TokenIssuer.prototype.getNewToken = function(kind, specificId, callback) {
	var payload = this._generateBasePayload();
	payload.exp = nextMonth().getTime();
	payload.data = {
		"kind": kind
		"username": specificId
	};

	this._encode(payload, callback);
}

/**
 * Revoke a token
 * @param  {String token}
 * @return {none}
 */
TokenIssuer.prototype.revoke = function(token) {
	var that = this;
	this._fullSolveToken(token, function(payload, err, jwtErr) {
		if (err) {
			logger.warn('Can\'t read token provided, was required to be revoked: '+err);
		} else if (jwtErr) {
			logger.info(jwtErr);
		} else {
			var uuid = payload.jit;

			var index = that.validUUIDs.indexOf(uuid);
			if (index > -1)
				that.validUUIDs.splice(index, 1);
		}
	});
}

/**
 * Solve a token with JWT.decode, then, check if the token is valid (not revoked).
 * @param  {[type]}
 * @param  {Function}
 * @return {[type]}
 */
TokenIssuer.prototype.solveToken = function(token, callback) {
	this._fullSolveToken(token, function(payload, err, jwtErr) {
		callback(payload.data, err, jwtErr);
	});
}


// private methods


/**
 * Solve a token with JWT.decode, then, check if the token is valid (not revoked).
 * @param  {[type]}
 * @param  {Function}
 * @return {[type]}
 */
TokenIssuer.prototype._fullSolveToken = function(token, callback) {
	var payload  = undefined;
	var errorMsg = undefined;
	var jwtError = undefined;

	jwt.decode(config.secret, token, function (err, decode) {
		if (err) {
			jwtError = err.name+": "+err.message;
		} else {
			payload = decode;
		}
	});

	if (typeof payload !== 'undefined' && !this._isValidUUID(payload.jit)) {
		errorMsg = 'Token is revoked!';
	} else if (payload.data.kind == Kind.OPENING_GAME || payload.data.kind == Kind.OPENING_LAUNCHER)
		this.revoke(payload.jit); 	// It's an OPENING: we revoke at the same time!

	callback(payload, errorMsg, jwtError);
}

/**
 * Generate a propoer UUID following the RFC4122
 * @return {String UUID}
 */
TokenIssuer.prototype._generateUUID = function() {
	// http://www.ietf.org/rfc/rfc4122.txt
	var s = [];
	var hexDigits = "0123456789abcdef";
	for (var i = 0; i < 36; i++) {
		s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
	}
	s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
	s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
	s[8] = s[13] = s[18] = s[23] = "-";

	var uuid = s.join("");
	return uuid;
}

/**
 * Generate the mandatory base for a payload
 * @return {object}
 */
TokenIssuer.prototype._generateBasePayload = function() {
	var uuid = this._generateUUID();
	this.validUUIDs.push(uuid);
	this.issuedTokens += 1;

	return {
		"iss": "Dobby_JWT",
		"jit": uuid,
		"iat": new Date().getTime(),
	};
};

/**
 * Check if a UUID is valid (revoked = deleted from the list)
 * @param  {String UUID}
 * @return {Boolean}
 */
TokenIssuer.prototype._isValidUUID = function(uuid) {
	for (var offset = 0 ; offset < this.validUUIDs.length ; offset++)
		if (this.validUUIDs[offset] == uuid)
			return true;
	return false;
};

/**
 * Encode a payload
 * @param  {object payload}
 * @param  {Function}
 * @return {none}
 */
TokenIssuer.prototype._encode = function(payload, callback) {
	var errorJwt = undefined;
	var generatedToken = undefined;
	jwt.encode(config.secret, payload, function (err, token) {
		if (err) {
			errorJwt = err.name+": "+err.message;
		} else {
			generatedToken = token;
		}
	});

	callback(generatedToken, errorJwt);
};
