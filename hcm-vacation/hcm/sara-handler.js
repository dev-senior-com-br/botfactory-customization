var fs = require('fs'),
    HcmClient = require('../hcm/hcm-client.js'),
    path = require('path'),
    consoleLogger = require('../util/console-logger.js'),
    moment = require('moment');

function SaraHandler() {
    
    const logger = consoleLogger(path.basename(__filename));
     var self = this,
        serviceUnavailableAnswer = 'Desculpe, estou passando por um momento de intensivo treinamento, tente novamente mais tarde por favor.',
        serviceErrorAnswer = 'Estou aprimorando minhas respostas, tente novamente mais tarde por favor.',
        serviceError = 'Desculpe, parece que não consegui interpretar sua mensagem. Vou precisar aprender a fazer isso, tente novamente mais tarde.';

    this.myVacationBalance = function (deferred, hcmClient) {
        
        hcmClient.currentUserVacationBalance().then(function (vacation) {
            try {
                var msg = "Seu saldo atual é de 0 dias.";
                let prog = false;
                let calc = false;

                if (vacation.opened && vacation.opened.length >= 1) {
                    msg = "";

                    // Saldo de férias
                    msg += 'Seu saldo atual:\n';
                    vacation.opened.forEach(function (vacationPeriod) {
                        if (vacationPeriod.vacationBalance) {
                            msg += orZero(vacationPeriod.vacationBalance) + ' dias no período aquisitivo de ' + moment(vacationPeriod.startDate).format("DD/MM/YYYY") + ' a ' + moment(vacationPeriod.endDate).format("DD/MM/YYYY") + '\n';
                        }
                    });

                    // Férias programadas
                    vacation.opened.forEach(function (vacationPeriod) {
                        if (vacationPeriod.vacationSchedule && vacationPeriod.vacationSchedule.length > 0) {
                            if(!prog) {
                                msg += '\nVocê tem férias programadas:\n';
                                prog = true;
                            }

                            vacationPeriod.vacationSchedule.forEach(function (schedule) {
                                msg += orZero(schedule.vacationDays) + ' dias de ' + moment(schedule.startDate).format("DD/MM/YYYY") + ' a ' + moment(schedule.endDate).format("DD/MM/YYYY");
                                if (schedule.vacationBonusDays > 0) {
                                    msg += ' com abono de ' + schedule.vacationBonusDays + ' dias';
                                }
                                msg += '\n'
                            });
                        }
                    });

                    // Férias calculadas
                    vacation.opened.forEach(function (vacationPeriod) {
                        if (vacationPeriod.vacationReceipt && vacationPeriod.vacationReceipt.length > 0) {
                            if(!calc) {
                                msg += '\nVocê tem férias calculadas:\n';
                                calc = true;
                            }
                            vacationPeriod.vacationReceipt.forEach(function (receipt) {
                                msg += orZero(receipt.vacationDays) + ' dias com início em ' + moment(receipt.startDate).format("DD/MM/YYYY");
                                if (receipt.vacationBonusDays > 0) {
                                    msg += ' e abono de ' + receipt.vacationBonusDays + ' dias';
                                }
                                msg += '\n';
                            });
                        }
                    });
                }
                deferred.resolve(msg);
            } catch (error) {
                logger.log('Error My Vacation Balance - Current User Vacation Balance', error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Error Current User Vacation Balance',err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    };
    
    this.myReturnVacation = function (deferred, hcmClient) {
        hcmClient.currentUserVacationBalance().then(vacation =>{
            try{
                let msg, date, bonus;
                if(vacation.opened && vacation.opened.length){

                    vacation.opened.forEach(vacationPeriod =>{

                        if (vacationPeriod.vacationSchedule && vacationPeriod.vacationSchedule.length) {
                            vacationPeriod.vacationSchedule.forEach(schedule =>{
                                let endDate = moment(schedule.endDate);
                                if (date > endDate || !date){
                                    date = endDate.format("DD/MM/YYYY");
                                    bonus = schedule.vacationBonusDays;
                                }
                            })   
                        }
                        
                        if (vacationPeriod.vacationReceipt && vacationPeriod.vacationReceipt.length > 0) {
                            vacationPeriod.vacationReceipt.forEach(receipt =>{
                                let endDate = moment(receipt.startDate).add(--receipt.vacationDays, 'days');
                                if (date > endDate || !date){
                                    date = endDate.format("DD/MM/YYYY");
                                    bonus = receipt.vacationBonusDays;
                                }
                            });
                        }

                    });
                }
                msg = date ? "As suas férias acabam no dia " + date : '';
                msg += bonus ? ' com abono de ' + bonus + ' dia' : '';
                msg += bonus > 1 ? 's' : '';
                msg = !msg ? "Você não possui férias agendadas" : msg;
                deferred.resolve(msg); 

            }catch (error){
                logger.log('myReturnVacation erro', error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(err =>{
            logger.error('Erro Current User Vacation Balance', err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    }
    
    /**
     * Wrapper que verifica se o usuário é lider antes de fazer uma chamada que avalia dados dos liderados.
     */
    this.leaderWrapper = function (deferred, hcmClient, leaderMethod, g7Token) {

        hcmClient.getLeaderInfo().then(function (leaderInfo) {
            if (!leaderInfo.isLeader) {
                var msg = 'Desculpe, mas não há nenhum liderado associado a você nesse momento...';
                deferred.resolve(msg);
            } else {
                leaderMethod(deferred, hcmClient, g7Token);
            }
        });
    };
    
    /**
     *
     */
    this.myTeamVacationBalance = function (deferred, hcmClient) {
        hcmClient.getVacationTeamSituation().then(function (vacationTeamSituation) {
            try {
                var msg = '';

                if (vacationTeamSituation.isEmpty) {
                    msg = 'Não encontrei esta pendência. Por gentileza, me informe o número de uma das pendências listadas.';

                } else {
                    var hasExpiredVacation = vacationTeamSituation.expiredVacation.length > 0,
                        hasExpiringVacation = vacationTeamSituation.expiringVacation.length > 0;

                    if (hasExpiredVacation) {
                        msg = 'Atenção, há pessoas em sua equipe que possuem férias vencidas: ';
                        vacationTeamSituation.expiredVacation.forEach(function (employee) {
                            msg += employee.personName + ' tem ' + employee.totalBalance + ' dias vencidos; ';
                        });
                    }

                    if (hasExpiringVacation) {
                        msg += 'Nos próximos 90 dias, você precisa providenciar as férias de: ';
                        vacationTeamSituation.expiringVacation.forEach(function (employee) {
                            msg += employee.personName + ', saldo de ' + employee.totalBalance + ' dias; ';
                        });
                    }

                    if (!hasExpiringVacation && !hasExpiredVacation) {
                        msg = 'Sua equipe está em dia com as férias! Não há nenhum colaborador com férias vencidas nem a vencer nos próximos dias. Parabéns!';
                    }
                }

                deferred.resolve(msg);
            } catch (error) {
                logger.log('My Team Vacation Balance - Get Vacation Team Situation',error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Erro Get Vacation Team Situation', err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    };    
    
    
    this.vacationNotice = function (deferred, hcmClient) {
        hcmClient.currentUserVacationBalance().then(function (vacationBalance) {
            try {
                var msg = 'Você pode confirmar seu aviso a partir de 40 dias antes do início de suas férias, respeitando o prazo máximo de 18 dias';

                if (vacationBalance.scheduled && vacationBalance.scheduled.length > 0) {
                    msg = 'Seu aviso de férias está disponível na PortoNet através do caminho: "Portal do RH" -> Confirmar aviso de férias. ' + msg;
                    msg += ', por sinal vejo que você possui uma próxima programação em: <ul>';
                    vacationBalance.scheduled.forEach(function (period) {
                        msg += '<li>' + period.vacationDays + ' dias - de ' + moment(period.startDate).format("DD/MM/YYYY") + ' a ' + moment(period.endDate).format("DD/MM/YYYY");
                        if (period.vacationBonusDays > 0) {
                            msg += ' - abono de ' + period.vacationBonusDays + ' dias';
                        }
                        msg += '</li>';
                    });
                    msg += '</ul>';

                    if (vacationBalance.totalBalance > 0) {
                        msg += '<br> Além disso, também tens um saldo de férias de ' + vacationBalance.totalBalance + ' dias.';
                    }
                } else {
                    msg += '. No momento, você não tem férias programadas.'
                    if (vacationBalance.totalBalance > 0) {
                        msg += 'Mas tens um saldo de férias de ' + vacationBalance.totalBalance + ' dias.';
                    }
                }
                deferred.resolve(msg);
            } catch (error) {
                logger.log('Vacation Notice - Current User Vacation Balance',error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Vacation Notice - Current User Vacation Balance', err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    };
    
    this.scheduledVacation = function (deferred, hcmClient) {
        hcmClient.currentUserVacationBalance().then(function (vacation) {
            try {
                var msg = "";
                let solicitadas = false;
                let programadas = false;
                let calculadas = false;
                let today = new Date();

                if (vacation.opened && vacation.opened.length >= 1) {
                    
                    // Férias solicitadas
                    vacation.opened.forEach(function (vacationPeriod) {
                        if (vacationPeriod.vacationRequest2 && vacationPeriod.vacationRequest2.length > 0) {
                            vacationPeriod.vacationRequest2.forEach(function (request) {
                                let dataSolicitadas = moment(request.vacation.startDate).toDate();
                                if(dataSolicitadas >= today){
                                    logger.log('usuário possui férias solicitadas', null);
                                    if(!solicitadas) {
                                        msg = 'Você possui a seguinte programação de férias:\n';
                                        solicitadas = true;
                                    }
                                    msg += orZero(request.vacation.vacationDays) + ' dias com início em ' + moment(request.vacation.startDate).format("DD/MM/YYYY");
                                    if (request.vacation.vacationBonusDays > 0) {
                                        msg += ' e abono de ' + request.vacation.vacationBonusDays + ' dias';
                                    }
                                    if (request.vacation.has13thSalaryAdvance > 0) {
                                        msg += '. Você solicitou o adiantamento do décimo terceiro salário.';
                                    }
                                    msg += '\n';
                                }
                            });
                        }
                    });

                    // Férias programadas
                    vacation.opened.forEach(function (vacationPeriod) {
                        if (vacationPeriod.vacationSchedule && vacationPeriod.vacationSchedule.length > 0) {
                            vacationPeriod.vacationSchedule.forEach(function (schedule) {
                                let dataProgramadas = moment(schedule.startDate).toDate();
                                if(dataProgramadas >= today){
                                    logger.log('usuário possui férias programadas', null);
                                    if (!programadas) {
                                        msg = msg + '\nVocê tem férias programadas:\n';
                                        programadas = true;
                                    }
                                    msg += orZero(schedule.vacationDays) + ' dias de ' + moment(schedule.startDate).format("DD/MM/YYYY") + ' à ' + moment(schedule.endDate).format("DD/MM/YYYY");
                                    if (schedule.vacationBonusDays > 0) {
                                        msg += ' com abono de ' + schedule.vacationBonusDays + ' dias';
                                    }
                                    if (schedule.has13thSalaryAdvance > 0) {
                                        msg += '. Foi solicitado o adiantamento do décimo terceiro salário.';
                                    }
                                    msg += '\n';
                                }
                            });
                        }
                    });

                    // Férias calculadas
                    vacation.opened.forEach(function (vacationPeriod) {
                        if (vacationPeriod.vacationReceipt && vacationPeriod.vacationReceipt.length > 0) {
                            vacationPeriod.vacationReceipt.forEach(function (receipt) {
                                let dataCalculadas = moment(receipt.startDate).toDate();
                                if(dataCalculadas >= today){
                                    logger.log('usuário possui férias calculadas', null);
                                    if (!calculadas) {
                                        msg = msg +'\nVocê tem férias calculadas:\n';
                                        calculadas = true;   
                                    }
                                    msg += orZero(receipt.vacationDays) + ' dias com início em ' + moment(receipt.startDate).format("DD/MM/YYYY");
                                    if (receipt.vacationBonusDays > 0) {
                                        msg += ' e abono de ' + receipt.vacationBonusDays + ' dias';
                                    }
                                    if (receipt.has13thSalaryAdvance > 0) {
                                        msg += '. Foi solicitado o adiantamento do décimo terceiro salário.';
                                    }
                                    msg += '\n';
                                }
                            });
                        }
                    });

                }
                
                msg = !msg ? "Você não possui férias solicitadas, programadas ou calculadas." : msg;  
                
                deferred.resolve(msg);
            } catch (error) {
                logger.log('Scheduled Vacation - Current User Vacation Balance',error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Scheduled Vacation - Current User Vacation Balance',err);
            deferred.resolve(serviceUnavailableAnswer);
        });

    };
    
    /**
     *
     */
    this.myTeamVacationApprovals = function (deferred, hcmClient) {
        hcmClient.getWaitingApprovalVacations().then(function (pendingVacation) {
            try {
                const manager = pendingVacation.MANAGER,
                    retManager = pendingVacation.RETURNED_TO_MANAGER,
                    hr = pendingVacation.HUMAN_RESOURCE_PROFESSIONAL;
                let msg = '';

                if (manager.length == 0 && retManager.length == 0) {
                    msg = 'Não há nenhuma aprovação pendente para você... ';
                } else {
                    var allManager = manager.concat(retManager);
                    msg = `Para você, ${pendencies2str(allManager)}`;

                }

                if (hr.length >= 1) {
                    msg += 'No RH, ' + pendencies2str(hr);
                }
                deferred.resolve(msg);
            } catch (error) {
                logger.log('My Team Vacation Approvals - Get Waiting Approval Vacations',error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Erro Get Waiting Approval Vacations', err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    };

    /**
     *
     */
    this.myTeamExpiredVacation = function (deferred, hcmClient) {
        hcmClient.getVacationTeamSituation().then((vacationTeamSituation) => {
            try {
                var msg = '';

                if (vacationTeamSituation.isEmpty) {
                    msg = 'Desculpe, mas não encontrei nenhum liderado ligado a você.';

                } else {
                    const hasExpiredVacation = vacationTeamSituation.expiredVacation?.length > 0;

                    if (hasExpiredVacation) {
                        msg = vacationTeamSituation.expiredVacation.length > 1 ? 'Há pessoas em sua equipe que possuem ' : 'Há uma pessoa na sua equipe que possui ';
                        msg += 'férias vencidas: ';
                        vacationTeamSituation.expiredVacation.forEach(employee => {
                            msg += `${employee.personName} tem ${employee.totalBalance} dias vencidos;`;
                        });
                    }

                    if (!hasExpiredVacation) {
                        msg = 'Não se preocupe, ninguém na sua equipe possui férias vencidas.';
                    }
                }

                deferred.resolve(msg);
            } catch (error) {
                logger.log('My Team Expired Vacation - Get Vacation Team Situation',error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Erro Get Vacation Team Situation',err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    };
    
    this.myScheduledTeamVacation = function (deferred, hcmClient) {
        hcmClient.getScheduledTeamVacation().then(scheduledVacation => {
            try {
                var msg = '';
                if (!scheduledVacation || !scheduledVacation.length) {
                    msg = 'Nenhum de seus liderados ou lideradas possuem férias programadas.';
                } else {
                    msg = 'Esta é a programação de férias agendadas da sua equipe:<ul>';
                    scheduledVacation.forEach(schedule => {
                        msg += '<li>' + schedule.personName + ' com ' + schedule.vacationDays + ' dias a partir de  ' + moment(schedule.startDate).format("DD/MM/YYYY");
                        if (schedule.vacationBonusDays && schedule.vacationBonusDays > 0) {
                            msg += '(abono de ' + schedule.vacationBonusDays + ')';
                        }
                        msg += '</li>';
                    });
                    msg += '</ul>';
                }

                deferred.resolve(msg);
            } catch (error) {
                logger.error('Erro Get Scheduled Team Vacation', error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Erro Get Scheduled Team Vacation', err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    };
    
    this.myCalculatedTeamVacation = function (deferred, hcmClient) {
        hcmClient.getCalculatedTeamVacation().then(function (scheduledVacation) {
            try {
                var msg = '';
                if (scheduledVacation == null || scheduledVacation.length == 0) {
                    msg = 'Nenhum de seus liderados ou lideradas possuem férias calculadas.';
                } else {
                    msg = 'Estes são os períodos de férias calculados da sua equipe:<ul>';
                    scheduledVacation.forEach(function (schedule) {
                        msg += '<li>' + schedule.personName + ' com ' + schedule.vacationDays + ' dias a partir de  ' + moment(schedule.startDate).format("DD/MM/YYYY");
                        if (schedule.vacationBonusDays && schedule.vacationBonusDays > 0) {
                            msg += '(abono de ' + schedule.vacationBonusDays + ')';
                        }
                        msg += '</li>';
                    });
                    msg += '</ul>';
                }

                deferred.resolve(msg);
            } catch (error) {
                logger.error('Erro Get Calculated Team Vacation', error);
                deferred.resolve(serviceErrorAnswer);
            }
        }).fail(function (err) {
            //Sara Handler always resolve the promise since the answer will be sent to the user
            logger.error('Erro Get Calculated Team Vacation', err);
            deferred.resolve(serviceUnavailableAnswer);
        });
    };

    



    function pendencies2str(pendencies) {
        var msg = '';
        if (pendencies.length == 1) {
            msg += 'existe ' + pendencies.length + ' solicitações: ';
        } else if (pendencies.length > 1) {
            msg += 'existem ' + pendencies.length + ' solicitações: ';
        }
        pendencies.forEach(function (request) {
            msg += request.personName + ': ' + request.vacationDays + ' a partir de ' + moment(request.startDate).format("DD/MM/YYYY");
            msg += request.vacationBonusDays != 0 ? ' (' + request.vacationBonusDays + ' de abono). ' : '. ';
        });

        return msg;
    }

    
    function orZero(value) {
        if (value == null || value.length === 0) {
            return 0;
        }

        return value;
    }

    
}

module.exports = SaraHandler;

