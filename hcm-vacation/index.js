const utils = require('./utils.js');
const SaraHandler = require('./hcm/sara-handler.js');
var HcmClient = require('./hcm/hcm-client.js');
var Q = require('q');

exports.handler = async (event) => {
    let token;
    let responseData;
    
    const q = event.queryStringParameters.q;
    const dataTable = event.queryStringParameters.dataTable;
    let dataKey = event.queryStringParameters.dataKey;
    const groupKey = event.queryStringParameters.groupKey;
    
    console.log("dataTable: " + dataTable + ", dataKey: " + dataKey + ", groupKey: " + groupKey);
    
    if (q) {
        
        var deferred = Q.defer();
        const token_type = event.headers["Authorization"].split(" ")[0];
        const access_token = event.headers["Authorization"].split(" ")[1];
        const tenant =  event.headers["X-tenant"];
        const username =  event.headers["X-username"];
        let jsonToken = `{ "username":"${username}", "token_type":"${token_type}","access_token":"${access_token}", "tenantName":"${ tenant }" }`;
        
        let hcmClient = new HcmClient().byToken(JSON.parse(jsonToken));
        
        var vacation = new SaraHandler();
        
        let res;
        const userData = null;
        switch (q) {
            case "saldo-ferias":
                vacation.myVacationBalance(deferred, hcmClient, userData);
                res = await deferred.promise;
                break;
            case "voltar-das-ferias":
                vacation.myReturnVacation(deferred, hcmClient, userData);
                res = await deferred.promise;
                break;
            case "aviso-ferias":
                vacation.vacationNotice(deferred, hcmClient, userData);
                res = await deferred.promise;
                break;
            case "minha-programacao-ferias":
                vacation.scheduledVacation(deferred, hcmClient, userData);
                res = await deferred.promise;
                break;                
            case "saldo-ferias-equipe":
                vacation.leaderWrapper(deferred, hcmClient, vacation.myTeamVacationBalance, userData);
                res = await deferred.promise;
                break;
            case "meus-liderados":
                vacation.leaderWrapper(deferred, hcmClient, vacation.mySubordinates, userData);
                res = await deferred.promise;
                break;
            case "aprovacoes-ferias-pendentes":
                vacation.leaderWrapper(deferred, hcmClient, vacation.myTeamVacationApprovals, userData);
                res = await deferred.promise;
                break;
            case "ferias-equipe-vencidas":
                vacation.leaderWrapper(deferred, hcmClient, vacation.myTeamExpiredVacation, userData);
                res = await deferred.promise;
                break;
            case "ferias-programadas":
                vacation.leaderWrapper(deferred, hcmClient, vacation.myScheduledTeamVacation, userData);
                res = await deferred.promise;
                break;
            case "ferias-calculadas":
                vacation.leaderWrapper(deferred, hcmClient, vacation.myCalculatedTeamVacation, userData);
                res = await deferred.promise;
                break;

         default:
                res = 'Hum, parece que ainda não aprendi a consultar o serviço ' + q;
        }        

        return utils.sendRes(200, JSON.stringify({type: 'PLAINTEXT', text: [`${res}`]}));
    }
    
    if (!dataTable) {
        const body = {
            type: 'PLAINTEXT',
            text: [`Não foi possivel obter uma respota para dataTable=${dataTable} e dataKey=${dataKey}. Solicite apoio ao administrador do sistema.`],
        };
        return utils.sendRes(400, JSON.stringify(body));
    }
    
    
    
    try {
        token = await utils.getToken(event.headers.Authorization);
    } catch (err) {
        console.error(err);
        const body = {
            type: 'PLAINTEXT',
            text: [`O resultado de ${dataKey} não esta disponvel para esse usuário.`],
        };
        return utils.sendRes(401, JSON.stringify(body));
    }
    

    try {
        const hostname = 'platform-arquitetura.senior.com.br';
        const port = 443;
        const username = event.headers["X-username"];
        
        
        if (groupKey == 'username') {
            dataKey = dataKey + ":" + username;
        }
        
        responseData = await utils.responseDataTable(hostname, port, dataTable, dataKey, token);
        console.log("Result for request at erp: " + responseData);
        const body = {
            type: 'PLAINTEXT',
            text: [
                `${responseData}`
            ],
        };
        return utils.sendRes(200, JSON.stringify(body));
    } catch (err) {
        console.log(err);
        const body = {
            type: 'PLAINTEXT',
            text: [`O resultado de ${dataKey} não esta disponibilizado. Tente novamente mais tarde.`],
            err: err
        };
        return utils.sendRes(200, JSON.stringify(body));
    }
};
