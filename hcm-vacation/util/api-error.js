'use strict';

function ApiError() {
    var errorMsg = null,
        errorObj = null,
        statusCode = null;

    this.getMessage = function() {
        return this.errorMsg;
    };

    this.getError = function() {
        return this.errorObj;
    };

    this.getStatusCode = function() {
        return this.statusCode;
    };

}

ApiError.prototype.msg = function (msg) {
    this.errorMsg = msg;
    this.errorObj = null;
    return this;
};

ApiError.prototype.error = function (err) {
    this.errorObj = err;
    this.errorMsg = null;
    return this;
};

ApiError.prototype.errorMsg = function (err, msg) {
    this.errorObj = err;
    this.errorMsg = msg;
    return this;
};

ApiError.prototype.errorStatus = function (err, status, msg) {
    this.errorObj = err;
    this.errorMsg = msg;
    this.statusCode = status;
    return this;
};

ApiError.prototype.inspect = function() {
    return JSON.stringify(this);
};

module.exports = ApiError;