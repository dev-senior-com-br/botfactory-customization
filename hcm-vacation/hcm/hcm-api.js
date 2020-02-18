var request = require('request'),
    Q = require('q'),
    path = require('path'),
    ApiError = require('../util/api-error.js'),
    moment = require('moment'),
    consoleLogger = require('../util/console-logger.js'),
    EnvVariables = require('../util/env-variables.js');

var logger = consoleLogger(path.basename(__filename));

function HcmApi() {
    var env = new EnvVariables(),
        apiBase = env.getHcmApiBase(),
        self = this;

    function g7CookieStr(token) {
        return 'com.senior.token=' + JSON.stringify(token);
    }

    function createOptions(method, apiPath, token, body) {
        var options = {
            "rejectUnauthorized": false, 
            method: method,
            json: true,
            url: apiPath,
            headers: {
                Authorization: 'Bearer ' + token.access_token,
                'Cookie': g7CookieStr(token)
            }
        };

        if (body != null) {
            options.body = body;
        }
        return options;
    }

    /**
    * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/vacation/getVacation
    */
    this.getVacation = function (token, employeeId) {
        const apiPath = apiBase + '/vacation/' + employeeId;
        return get(apiPath, token);
    }

    /**
    * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/login/get
    */
    this.getLogin = function (token) {
        const apiPath = apiBase + '/login';
        return get(apiPath, token);
    }

    this.getHyperlinks = function (token, employeeId, roleId) {
        const apiPath = `${apiBase}/hyperlink/all/${employeeId}/${roleId}`;
        return get(apiPath, token);
    }

    this.getOtherSystemConfiguration = function (token) {
        const apiPath = `${apiBase}/other-system-configuration/login/urls`;
        return get(apiPath, token);
    }

    this.refreshToken = function (token) {
        var deferred = Q.defer();

        let params = {
            refreshToken: token.refresh_token
        };

        let url = env.getG7ApiBase();
        
        token.tenantName = !token.tenantName ? (token.username.split('@')[1]).split('.')[0] : token.tenantName;

        let options = {
            "rejectUnauthorized": false, 
            method: 'POST',
            body: params,
            json: true,
            url: url + '/platform/authentication/actions/refreshToken',
            headers: {
                'Authorization': token.token_type + ' ' +  token.access_token,
                'x-tenant': token.tenantName,
                'Content-Type': 'application/json'
            }
        };

        request(options, function (err, httpResponse, body) {
            if (err) {
                deferred.reject(new ApiError().errorStatus(err, 401));
            } else if (httpResponse.statusCode != 200) {
                deferred.reject(new ApiError().msg(`Cannot request a refresh token: ${httpResponse.statusCode}`));
            } else {
                deferred.resolve(body);
            }
        });

        return deferred.promise;
    }

    /**
     * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/personfilter/getActive
     */
    this.getActivePersonFilter = function (token, employeeId) {
        logger.debug('getActivePersonFilter() using token ' + token, null);
        var deferred = Q.defer();

        if (token == null) {
            deferred.reject(new ApiError().msg('Cannot request server data without a token'));
            return deferred.promise;
        }
        var apiPath = apiBase + '/personfilter/' + employeeId + '/filter/active';
        var options = createOptions('GET', apiPath, token);

        request(options, function (err, httpResponse, body) {
            logger.debug('Status Code response: ' + httpResponse.statusCode, null);
            if (httpResponse.statusCode == 204) {
                //204 - No content: user has no filter
                deferred.resolve({});
            } else if (err || httpResponse.statusCode != 200) {
                logger.error('Service failure  ' + apiPath,  err);
                deferred.reject(new ApiError().errorStatus(err, httpResponse.statusCode));
            }

            deferred.resolve(body);
        });
        return deferred.promise;
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/vacation/getVacationTeamSituation
     */
    this.getVacationTeamSituation = function (token, employeeId) {
        logger.debug('getVacationTeamSituation() using token ' + token + ' employeeId ' + employeeId, null);
        var deferred = Q.defer();

        if (token == null) {
            deferred.reject(new ApiError().msg('Cannot request server data without a token'));
            return deferred.promise;
        }

        self.getActivePersonFilter(token, employeeId).then(function (filter) {
            logger.log('Using filter  ' + filter, null);
            var currentDate = moment().format('YYYY-MM-DD'),
                //180 dias é o mesmo que o HCM utiliza nos fontes do frontend. Verificado com o Felipe Corso - 26/04/17
                futureDate = moment().add(180, 'days').format('YYYY-MM-DD');

            filter.date = futureDate;
            filter.currentDate = currentDate;
            filter.employeeId = employeeId;

            var postBody = {
                date: futureDate,
                currentDate: currentDate,
                filter: filter
            };

            var apiPath = apiBase + '/vacation/team/' + employeeId;
            var options = createOptions('POST', apiPath, token, postBody);

            request(options, function (err, httpResponse, body) {
                logger.log('Status Code response: ' + httpResponse.statusCode, null);
                if (err || httpResponse.statusCode != 200) {
                    var errorMsg = 'Service failure (' + httpResponse.statusCode + ') ' + apiPath + ' ' + err;
                    logger.error('Error getActivePersonFilter request', errorMsg);
                    deferred.reject(new ApiError().errorStatus(err, httpResponse.statusCode, errorMsg));
                }
                deferred.resolve(body);
            });

        }).fail(function (error) {
            //it is already an ApiError
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     * 
     */
    this.getFeedbacks = function(token, employeeId) {
        const deferred = Q.defer();
        const url = env.getHcmApiBase();
        const options = {
            "rejectUnauthorized": false, 
            method: 'GET',
            json: true,
            url: `${url}/feedback/${employeeId}/received`,
            headers: {
                'Authorization': token.token_type + ' ' +  token.access_token,
                'x-tenant': token.tenantName,
                'Content-Type': 'application/json',
                'Content-Length': 1
            }
        };

        request(options, function (err, httpResponse, body) {
            if (err) {
                logger.error('API error', err);
                deferred.reject(new ApiError().errorStatus(err, 401));
            } else if (httpResponse.statusCode != 200) {
                logger.error('Cannot request a refresh token', null);
                deferred.reject(new ApiError().msg(`Cannot request a refresh token: ${httpResponse.statusCode}`));
            } else {
                deferred.resolve(body);
            }
        });
        return deferred.promise;
    }

    /**
     * 
     */
    this.getPayrollAnalytics = function(token, employeeId) {
        var apiPath = `${apiBase}/payrollregister/recents/${employeeId}/analytics?activeEmployeeId=${employeeId}`;
        return get(apiPath, token);
    }

    /**
     * 
     */
    this.getPayrollRegisterV2 = function(token, employeeId, month, year) {
        var apiPath = `${apiBase}/payrollregister/recents-by-reference/${employeeId}/sara/${month}/${year}`;
        return get(apiPath, token);
    }


    /**
     * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/vacation/getWaitingApprovalVacations
     */
    this.getWaitingApprovalVacations = function (token, employeeId) {
        var apiPath = apiBase + '/vacation/team/' + employeeId + '/waiting-approval';
        return get(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/employee%2Fdashboard/getEmployeeDashboard
     */
    this.getEmployeeDashboard = function (token, employeeId) {
        var apiPath = apiBase + '/employee/dashboard/employee/' + employeeId;
        return get(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/notification/getLastTenNotificationsWithUnreadStatus
     */
    this.getUnreadNotifications = function (token) {
        var apiPath = apiBase + '/notification/new-notification-with-unread-information';
        return get(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/team/get
     */
    this.getMyTeam = function (token, employeeId) {
        var apiPath = apiBase + '/team/' + employeeId;
        return get(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/vacation/team/9EF6EEB833AC43A79F34F68B4F497E91/scheduled
     */
    this.getScheduledTeamVacation = function (token, employeeId) {
        var apiPath = apiBase + '/vacation/team/' + employeeId + '/scheduled';
        return post(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/vacation/team/9EF6EEB833AC43A79F34F68B4F497E91/calculated
     */
    this.getCalculatedTeamVacation = function (token, employeeId) {
        var apiPath = apiBase + '/vacation/team/' + employeeId + '/calculated';
        return post(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/vacationrequestupdate/opened/C145F5D2E1AA46659F1F4676A6A2D038
     */
    this.getVacationOpenedPeriods = function (token, employeeId) {
        var apiPath = apiBase + '/vacationrequestupdate/opened/' + employeeId;
        return get(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/vacationrequestupdate
     * 
     */
    this.vacationRequest = function (token, payload) {        
        var apiPath = apiBase + '/vacationrequestupdate';
        return post(apiPath, token, payload);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/performance-management/performance-appraisal/myteam/9EF6EEB833AC43A79F34F68B4F497E
     */
    this.getTeamResults = function(token, employeeId) {
        var apiPath = apiBase + '/performance-management/performance-appraisal/myteam/' + employeeId;
        return get(apiPath, token);
    };

    this.getIndividualGoalsApi = function(token, employeeId){
        var apiPath = apiBase + '/performance-management/performance-appraisal/most-recent/employee/' + employeeId;
        return get(apiPath, token);
    };

    /**
     * https://hcm-api.senior.com.br/hcm-api/apidocs/#!/employee/getEmployeeSummary
     */
    this.getEmployeeSummary = function(token, employeeId) {
        var apiPath = `${apiBase}/employee/${employeeId}/summary`;
        return get(apiPath, token);
    }

    /**
     * Date format = dd/MM/yyyy
     */
    this.getPayrollRegisterPDF = function(token, registerNumber, initialDate, finalDate) {
        var apiPath = `https://www2.senior.com.br/rubisenior/conector?ACAO=EXEREL&SIS=FP&NOME=FPEN105.ENV&dado_EIniPerCal=${initialDate}&dado_EFimPerCal=${finalDate}&dado_EIncOca=N&dado_EAbrTipCal=11&dado_EAbrEmp=1&dado_EAbrTcl=1&dado_EAbrCad=${registerNumber}&LINWEB=&dado_EIncOca=S&dado_EMosBat=A&dado_EMarPon=N&dado_ETruMar=N&dado_ETruEnt=0&dado_ETruSai=0&dado_ETruLim=N&dado_EAbrFil=&order_Cabecalho_do_Envelope=0`;
        return get(apiPath, token);
    }

    this.getDescendants = (ticket, employeeId, token) =>{
        const deferred = Q.defer();
        const apiPath = apiBase + `/team/${employeeId}/all-descendants?limit=1&offset=0&activeEmployeeId=${employeeId}&ticket=${ticket}` 

        const options = {
            rejectUnauthorized: false, 
            method: 'GET',
            url: apiPath,
            headers: {
                Authorization: 'Bearer ' + token.access_token,
                'Cookie': g7CookieStr(token),
                'Content-Type': 'application/json;charset=utf-8',
                'Content-Length': 1
            }
        };
        logger.debug('API GET  ' + apiPath, null);

        request(options, function (err, httpResponse, body) {
            try {
                logger.debug('Status Code response: ' + httpResponse.statusCode, null);
                if (err || httpResponse.statusCode != 200) {
                    deferred.reject(err);
                } else {
                    deferred.resolve(JSON.parse(body).totalElements);
                }
            } catch (err) {
                logger.error('Error getDescendants request', err);
                deferred.reject(new ApiError().errorMsg('Error requesting data', err));
            }
        });
        return deferred.promise;
    }

    function get(apiPath, token) {
        logger.debug('API GET  ' + apiPath, null);
        var deferred = Q.defer();

        if (token == null) {
            deferred.reject(new ApiError().msg('Cannot request server data without a token'));
            return deferred.promise;
        }
        
        var options = createOptions('GET', apiPath, token);

        request(options, function (err, httpResponse, body) {   
            try {
                logger.log('Status Code response: ' + httpResponse, null);
                //TODO: Consider code 204 - No Content
                if (err || !httpResponse ||httpResponse.statusCode != 200) {
                    var errorMsg = 'Service failure (' + httpResponse + ') ' + apiPath + ' ' + err;
                    logger.error('Error get request', errorMsg);
                    deferred.reject(new ApiError().errorStatus(err, httpResponse, errorMsg, httpResponse.statusCode));
                } else {
                    var jsonObj = (typeof body === 'string' || body instanceof String) ? JSON.parse(body) : body;
                    deferred.resolve(jsonObj);
                }
            } catch (err) {
                logger.error('Error get request', err);
                deferred.reject(new ApiError().errorMsg('Error requesting data', err));
            }

        });

        return deferred.promise;
    }

    function post(apiPath, token, payload) {
        logger.debug('API POST: ' + apiPath, null);
        var deferred = Q.defer();

        if (token == null) {
            deferred.reject(new ApiError().msg('Cannot request server data without a token'));
            return deferred.promise;
        }

        // var options = createOptions('GET', apiPath, token);        
        var options = {
            "rejectUnauthorized": false, 
            method: 'POST',
            url: apiPath,
            headers: {
                Authorization: 'Bearer ' + token.access_token,
                'Cookie': g7CookieStr(token),
                'Content-Type': 'application/json;charset=utf-8'
            }
        };

        if (payload != null) {
            options.body = payload;
            options.json = true;
        }

        request(options, function (err, httpResponse, body) {
            try {
                logger.log('Status Code response: ' + httpResponse.statusCode, null);
                //TODO: Consider code 204 - No Content
                if (err || (httpResponse.statusCode < 200 || httpResponse.statusCode > 299)) {
                    var errorMsg = 'Service failure (' + httpResponse.statusCode + ') ' + apiPath + ' ' + err;
                    logger.error('Error post request', errorMsg);
                    deferred.reject(new ApiError().errorStatus(err, httpResponse.statusCode, errorMsg));
                } else {
                    var jsonObj = (typeof body === 'string' || body instanceof String) ? JSON.parse(body) : body;
                    deferred.resolve(jsonObj);
                }

            } catch (err) {
                logger.error('Error post request', err);
                deferred.reject(new ApiError().errorMsg('Error requesting data', err));
            }

        });

        return deferred.promise;
    }
}

module.exports = HcmApi;
