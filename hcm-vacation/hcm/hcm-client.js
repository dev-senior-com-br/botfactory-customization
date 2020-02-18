'use strict';

var Q = require('q'),
    path = require('path'),
    HcmApi = require('./hcm-api.js'),
    moment = require('moment'),
    consoleLogger = require('../util/console-logger.js'),
    EnvVariables = require('../util/env-variables.js');

    
function HcmClient() {
    const logger = consoleLogger(path.basename(__filename));
    var self = this,
        hcmApi = new HcmApi(),
        env = new EnvVariables();
        
    self.tokenDeferred = Q.defer();
    self.numberDeferred = Q.defer();
    self.tokenPromise = self.tokenDeferred.promise;
    self.numberPromise = self.numberDeferred.promise;

    self.getTokenQ = function () {
        return self.tokenPromise;
    }

    self.getNumberQ = function () {
        return self.numberPromise;
    }
 
    self.login = function() {
        logger.debug('login', null);

        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            logger.debug('User token ' + JSON.stringify(token));

            hcmApi.getLogin(token).then(function (userData) {
                const idx = (userData.session.employees.length > 1) ? 1 : 0;
                deferred.resolve({employeeId: userData.session.employees[idx].id, userData});
            }).fail(function (error) {
                logger.error('Service error obtainng user data hcm/login', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on hcmClient token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    self.refreshToken = function() {
        logger.debug('refreshToken',null);
        var deferred = Q.defer();

        self.tokenPromise.then((token) => {
            hcmApi.refreshToken(token).then(function(newcookie) {
                var email = JSON.parse(newcookie.jsonToken).username.toLowerCase();

                self.numberPromise.then(function(number) {
/*                    wDB.updateTokenFromNumber(number, newcookie, email).then(function() {
                        deferred.resolve(newcookie);
                    }).catch((err) => {
                        logger.error('Não foi possível salvar o novo cookie', err);
                        deferred.reject(err);
                    });
                    */
                }).fail(function (error) {
                    logger.error('Service error on phone number', error);
                    deferred.reject(error);
                });
            }, function(err) {
                logger.error('Não foi possível fazer o refresh cookie, refazer o login', err);

                self.numberPromise.then(function (number) {
                    /* wDB.getLoginURLWithPIN(number).then(function(url) {
                        logger.log(url, null);
                        //here must logout
                        deferred.reject(`Desculpe, não foi possível recuperar sua chave de autenticação. Por favor, refaça o login na Plataforma Senior X através deste link: ${url} e volte a falar comigo. Obrigada 😉`);
                    }).catch((err) => {
                        logger.error('Erro não foi possível recriar o pin', err);
                        deferred.reject(err);
                    });*/
                }).fail(function (error) {
                    logger.error('Service error on phone number', error);
                    deferred.reject(error);
                });
            });
        });

        return deferred.promise;
    };

    /**
     * 
     */
    self.getPayrollAnalytics = function(employeeId) {
        logger.debug('getPayrollAnalytics', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));
            hcmApi.getPayrollAnalytics(token, employeeId).then(function (userData) {
                deferred.resolve(userData);
            }).fail(function (error) {
                logger.error('Service error obtainng user data hcm/login ', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on hcmClient token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    }

    self.getPayrollRegisterV2 = function(employeeId, context) {
        logger.debug('getPayrollRegister', null);
        let deferred = Q.defer();
        let flag;

        self.tokenPromise.then(token =>{
            var month;
            var year;
            if(context.date || context.monthNumber){
                month = context.date ? context.date.split("-", 2)[1] : context.monthNumber;
                year = context.date ? context.date.split("-", 2)[0] : moment().format('YYYY');
                if(moment().format('YYYY') < parseInt(year)){
                    year = moment().format('YYYY');
                }
            }else{
                flag = true;
                month =  moment().format('MM');
                year =  moment().format('YYYY');
            }


            hcmApi.getPayrollRegisterV2(token, employeeId, month, year).then(async data =>{

                if(data.length == 0 && flag){
                
                    if(month == 1){
                        month = 12;
                        year--;
                    }else{
                        month--;
                    }
                    
                    data = await hcmApi.getPayrollRegisterV2(token, employeeId, month, year);
                }
                var msg = (data.length > 1 && !context.nHolerite && !context.tHolerite) ?
                "Você tem " + data.length + " holerites. Digite a opção desejada." :
                data.length == 0 ? "Você não possui folha calculada nesse período." :
                "Aqui está seu holerite";
                    
                let res = {
                    data,
                    msg
                }
                deferred.resolve(res);
            }).fail(error =>{
                logger.error('Service error obtainng user data hcm/login', error);
                deferred.reject(error);
            });
        }).fail(error =>{
            logger.error('Service error on hcmClient token', error); 
            deferred.reject(error);
        });

        return deferred.promise;
    }

    
    /**
     *
     */
    self.currentEmployeeId = function () {
        logger.debug('currentEmployeeId', null);
        var deferred = Q.defer();

        self.login().then(function (userData) {
            deferred.resolve(userData);
        }).fail(function (error) {
            logger.error('Service error obtainng user data hcm/login', error);
            deferred.reject(error);                
        });        

        return deferred.promise;
    };

    /**
     * Returns the current user vacation summary
     */
    self.currentUserVacationBalance = function () {
        logger.debug('currentUserVacationBalance', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId '+ employeeId, null);

                hcmApi.getVacation(token, employeeId).then(function (vacationData) {
                    deferred.resolve(vacationData);
                }).fail(function (error) {
                    logger.error('Vacation service failure', error);
                    deferred.reject(error);
                });
            }).fail(function (error) {
                //Service error obtaining employeeId
                logger.error('Service error obtaining employeeId', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on hcmClient token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    };


    /**
     * 
     */
    self.employeeFeedback = function(employeeId){
        logger.debug('employeeFeedback', null);
        const deferred = Q.defer();
        self.tokenPromise.then(token =>{
            hcmApi.getFeedbacks(token, employeeId).then(feedbacks =>{
                deferred.resolve(feedbacks);
            }).fail(err =>{
                logger.error('Service error obtaining feedbacks', err);
                deferred.reject(err);
            })
        }).fail(err =>{
            logger.error('Service error on hcmClient token', err);
            deferred.reject(err);
        });
        return deferred.promise;
    }

    self.employeeHyperlinks = function(employeeId, roleId){
        logger.debug('employeeHyperlinks', null);
        const deferred = Q.defer();
        self.tokenPromise.then(token =>{
            hcmApi.getHyperlinks(token, employeeId, roleId).then(hyperlinks =>{
                deferred.resolve(hyperlinks);
            }).fail(err =>{
                logger.error('Service error obtaining hyperlinks', err);
                deferred.reject(err);
            })
        }).fail(err =>{
            logger.error('Service error on hcmClient token', err);
            deferred.reject(err);
        });
        return deferred.promise;
    }

    self.getOtherSystemConfiguration = function(){
        logger.debug('getOtherSystemConfiguration', null);
        const deferred = Q.defer();
        self.tokenPromise.then(token =>{
            hcmApi.getOtherSystemConfiguration(token).then(confs =>{
                deferred.resolve(confs);
            }).fail(err =>{
                logger.error('Service error obtaining hyperlinks', err);
                deferred.reject(err);
            })
        }).fail(err =>{
            logger.error('Service error on hcmClient token', err);
            deferred.reject(err);
        });
        return deferred.promise;
    }



    /**
     *
     */
    self.getVacationTeamSituation = function () {
        logger.debug('getVacationTeamSituation', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId ' + employeeId, null);

                hcmApi.getVacationTeamSituation(token, employeeId).then(function (vacationTeamSituation) {
                    var teamVacationSummary = {
                        expiredVacation: [],
                        expiringVacation: [],
                        isEmpty: true
                    };

                    var isEmptyObject = Object.keys(vacationTeamSituation).length === 0 && vacationTeamSituation.constructor === Object;
                    if (isEmptyObject) {
                        deferred.resolve(teamVacationSummary);
                    }

                    var expiredVacation = vacationToMap(vacationTeamSituation.expiredVacation),
                        expiringVacationNext90 = vacationToMap(vacationTeamSituation.vacationExpiringNext90Days),
                        expiringVacationFrom90 = vacationToMap(vacationTeamSituation.vacationExpiringFrom90Days);

                    var allExpiring = Array.from(expiringVacationFrom90.values()).concat(Array.from(expiringVacationNext90.values()));
                    teamVacationSummary.expiredVacation = Array.from(expiredVacation.values());
                    teamVacationSummary.expiringVacation = allExpiring;
                    teamVacationSummary.isEmpty = false;

                    deferred.resolve(teamVacationSummary);
                }).fail(function (error) {
                    logger.error('Vacation Team Situation service failure', error);
                    deferred.reject(error);
                });
            }).fail(function (error) {
                logger.error('Service error obtaining employeeId', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on hcmClient token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    self.employeeRegisterNumber = function() {
        logger.debug('employeeRegisterNumber', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId ' + employeeId, null);

                hcmApi.getEmployeeSummary(token, employeeId).then(function (employeeSumarry) {
                    deferred.resolve(employeeSumarry.registerNumber);
                }).fail(function (error) {
                    logger.error('Employee sumarry service failure', error);
                    deferred.reject(error);
                });
            }).fail(function (error) {
                //Service error obtaining employeeId
                logger.error('Service error obtaining employeeId', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on hcmClient token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    function vacationToMap(anArray) {
        var expiringVacation = new Map();
        if (anArray == null || anArray.length == 0) {
            return expiringVacation;
        }
        anArray.forEach(function (vacationPeriod) {
            if (expiringVacation.has(vacationPeriod.personName)) {
                vacationDetails = expiringVacation.get(vacationPeriod.personName);
                vacationDetails.totalBalance += vacationPeriod.vacationBalance;
            } else {
                var vacationDetails = {
                    personName: vacationPeriod.personName,
                    totalBalance: vacationPeriod.vacationBalance
                };
                expiringVacation.set(vacationPeriod.personName, vacationDetails);
            }
        });

        return expiringVacation;
    };

    /**
     *
     */
    this.getWaitingApprovalVacations = function () {
        return hcmApiMethod(hcmApi.getWaitingApprovalVacations);
    };

     /**
     * 
     */
    this.getLoginInfo = function () {
        return hcmApiMethod(hcmApi.getLogin);
    };

    /**
     *
     */
    this.getEmployeeDashboard = function () {
        logger.debug('getEmployeeDashboard', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId ' + employeeId, null);

                hcmApi.getEmployeeDashboard(token, employeeId).then(function (dashboard) {
                    deferred.resolve(dashboard);
                }).fail(function (error) {
                    logger.error('Dashboard service failure', error);
                    deferred.reject(error);
                });
            }).fail(function (error) {
                logger.error('Service error obtaining employeeId', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on g7 token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     *
     */
    this.getUnreadNotifications = function () {
        return hcmApiMethod(hcmApi.getUnreadNotifications);
    };

    /**
     *
     */
    this.getMyTeam = function () {
        return hcmApiMethod(hcmApi.getMyTeam);
    };

    /**
     *
     */
    this.getLeaderInfo = function () {
        logger.debug('isLeader', null);
        var deferred = Q.defer();

        self.getMyTeam().then(function (myTeamList) {
            try {
                var myTeam = myTeamList.list;
                var teamInfo = {isLeader: false};

                if (myTeam == null || myTeam.length == 0) {
                    deferred.resolve(teamInfo);
                } else {
                    var directDescendantsCount = 0;
                    myTeam.forEach(function (department) {
                        if (department.directDescendants) {
                            directDescendantsCount += department.directDescendants.length;
                        }
                    });
                    teamInfo.isLeader = directDescendantsCount > 0;
                    deferred.resolve(teamInfo);
                }

            } catch (error) {
                logger.error('Error getLeaderInfo in getMyTeam function ', error);
                deferred.reject(error);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Error getLeaderInfo in getMyTeam function ', err);
            deferred.reject(err);
        });

        return deferred.promise;
    };

    /**
     *
     */
    this.getScheduledTeamVacation = function () {
        return hcmApiMethod(hcmApi.getScheduledTeamVacation);
    };

    /**
     *
     */
    this.getCalculatedTeamVacation = function () {
        return hcmApiMethod(hcmApi.getCalculatedTeamVacation);
    }

    /**
     *
     */
    this.getVacationOpenedPeriodsFormData = function () {
        logger.debug('getVacationOpenedPeriods', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId ' + employeeId, null);

                hcmApi.getVacationOpenedPeriods(token, employeeId).then(function (vacationOpenedPeriodsData) {
                    var data = JSON.parse(JSON.stringify(vacationOpenedPeriodsData));

                    if (data.openedPeriods) {
                        for (var i = 0; i < data.openedPeriods.length; i++) {
                            var item = data.openedPeriods[i];

                            formatVacationPeriodLabel(i +1, item);
                        }

                        if (data.vacationRequestUpdate && data.vacationRequestUpdate.vacation) {
                            if (data.vacationRequestUpdate.vacation.vacationPeriod) {
                                formatVacationPeriodLabel(data.vacationRequestUpdate.vacation.vacationPeriod);
                            }
                        }
                    }

                    deferred.resolve(data);
                }).fail(function (error) {
                    logger.error('Vacation service failure', error);
                    deferred.reject(error);
                });
            }).fail(function (error) {
                //Service error obtaining employeeId
                logger.error('Service error obtaining employeeId', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on g7 token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    };

    /**
     *
     */
    this.vacationRequest = function (data) {
        logger.debug('vacationRequest', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId ' + employeeId, null);

                var payload = {
                    startDate: data.startDate,
                    vacationDays: data.vacationDays,
                    has13thSalaryAdvance: data.has13thSalaryAdvance,
                    vacationBonusDays: data.vacationBonusDays,
                    attachments: [],
                    vacationPeriodId: data.vacationPeriodId,
                    employeeId: employeeId
                }

                hcmApi.vacationRequest(token, payload).then(function () {
                    deferred.resolve("A solicitação de programação de férias foi enviada. Você receberá um retorno em breve.");
                }).fail(function (error) {
                    logger.error('Vacation service failure', error);
                    deferred.reject(error);
                });
            }).fail(function (error) {
                //Service error obtaining employeeId
                logger.error('Service error obtaining employeeId', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on g7 token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    }

    /**
     *
     */
    this.getTeamResults = function () {
        logger.debug('getTeamResults', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId ' + employeeId, null);

                hcmApi.getTeamResults(token, employeeId).then(function (results) {
                    var teamResults = {
                        startDate: null,
                        endDate: null,
                        results: []
                    };

                    if (results.cycle && results.performanceAppraisalList && results.performanceAppraisalList.length > 0) {
                        teamResults.startDate = getFormattedDate(results.cycle.startDate);
                        teamResults.endDate = getFormattedDate(results.cycle.endDate);

                        results.performanceAppraisalList.forEach(function (result) {
                            teamResults.results.push({
                                name: result.personFullName,
                                numberOfGoals: result.numberOfGoals,
                                percent: result.percentageOfAchievement ? result.percentageOfAchievement : 0
                            });
                        });
                    }

                    deferred.resolve(teamResults);
                }).fail(function (error) {
                    logger.error('Vacation service failure', error);
                    deferred.reject(error);
                });
            }).fail(function (error) {
                //Service error obtaining employeeId
                logger.error('Service error obtaining employeeId ', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on g7 token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    }

    /**
     * Busca as metas individuais
     * @returns {promise|Promise|*}
     */
    this.myIndividualGoals = function () {
        logger.debug('myIndividualGoals', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('employeeId ' + employeeId, null);
                hcmApi.getIndividualGoalsApi(token, employeeId).then(function (individualGoals) {
                        deferred.resolve(individualGoals);
                    }).fail(function (error) {
                        logger.error('Individual goals service failure', error);
                        deferred.reject(error);
                    });
            }).fail(function (error) {
                //Service error obtaining employeeId
                logger.error('Service error obtaining employeeId', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on g7 token', error);
            deferred.reject(error);
        });

        return deferred.promise;
    }

    /**
     * Busca o total de liderados
     * 
     */
    self.myDescendants = (ticket, employeeId) =>{
        logger.debug('myDescendants', null);
        const deferred = Q.defer();

        self.tokenPromise.then(token => {
            hcmApi.getDescendants(ticket, employeeId, token).then(descendants => {
                deferred.resolve(descendants);
            });
        }).fail(error =>{
            logger.error('Service error on hcm token', error);
            deferred.reject(error);
        });
        return deferred.promise;
    }

    function getFormattedDate(unformattedDate) {
        return unformattedDate ? moment(unformattedDate, "YYYY-MM-DD").format("DD/MM/YYYY") : null;
    }

    function formatVacationPeriodLabel(id, vacationPeriod) {
        var returnData = [];
        returnData.push(`${id}`);
        if (vacationPeriod.startDate) {
            returnData.push(`${moment(vacationPeriod.startDate, "YYYY-MM-DD").format("DD/MM/YYYY")}`);
        }
        if (vacationPeriod.endDate) {
            returnData.push(`${moment(vacationPeriod.endDate, "YYYY-MM-DD").format("DD/MM/YYYY")}`);
        }
        if (vacationPeriod.leaveBalance) {
            returnData.push("Saldo atual: " + vacationPeriod.leaveBalance + " dias");
        }

        vacationPeriod.label = returnData.join(' - ');
    }

    /**
     *
     */
    function hcmApiMethod(method) {
        logger.debug('hcmApiMethod', null);
        var deferred = Q.defer();

        self.tokenPromise.then(function (token) {
            //logger.debug('User token ' + JSON.stringify(token));

            self.currentEmployeeId().then(function ({employeeId}) {
                logger.log('EmployeeId ' + employeeId, null);

                method(token, employeeId).then(function (data, userData) {
                    deferred.resolve(data, userData);
                }).fail(function (error) {
                    logger.error('Service failure', error);
                    deferred.reject(error);
                });

            }).fail(function (error) {
                logger.error('Service error obtaining employeeId ', error);
                deferred.reject(error);
            });
        }).fail(function (error) {
            logger.error('Service error on hcmClient token ', error);
            deferred.reject(error);
        });

        return deferred.promise;
    };
}

HcmClient.prototype.byToken = function (token) {
    this.tokenDeferred.resolve(token);
    this.tokenPromise = this.tokenDeferred.promise;

    return this;
};

HcmClient.prototype.byTokenAndNumber = function (token, number) {
    this.tokenDeferred.resolve(token);
    this.numberDeferred.resolve(number);
    this.tokenPromise = this.tokenDeferred.promise;
    this.numberPromise = this.numberDeferred.promise;
    
    return this;
};

module.exports = HcmClient;
