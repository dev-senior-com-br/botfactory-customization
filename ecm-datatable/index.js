const utils = require('./utils.js');

exports.handler = async (event) => {
    let token;
    let erp;
    const dataTable = event.queryStringParameters.dataTable;
    const dataKey = event.queryStringParameters.dataKey;
    const image = event.queryStringParameters.image;
    const dev = event.queryStringParameters.dev;
    

    if (!dataTable) {
        const body = {
            type: 'PLAINTEXT',
            text: [`Não foi possivel obter uma respota para dataTable=${dataTable} e dataKey=${dataKey}. Solicite apoio ao administrador do sistema.`],
        };
        return utils.sendRes(401, JSON.stringify(body));
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
        const hostname = dev ? 'platform-arquitetura.senior.com.br' : 'platform.senior.com.br';
        const port = dev ? null : 443;
        erp = await utils.responseDataTable(hostname, port, dataTable, dataKey, token);
        console.log("Result for request at erp: " + erp);
        const body = {
            type: 'PLAINTEXT',
            text: [
                `${erp}`
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
