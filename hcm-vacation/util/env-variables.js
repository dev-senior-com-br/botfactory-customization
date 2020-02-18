
var fs = require('fs'),
    path = require('path'),
    consoleLogger = require('./console-logger');
    
    
function EnvVariables() {
    var logger = consoleLogger(path.basename(__filename));

    this.scope = function() {
        let scope = 'dev';
        if (process.env.SCOPE) {
            scope = process.env.SCOPE;
        } else {
            logger.log('Variável de ambiente TENANT_KEY não encontrada. Será utilizado o valor padrão ' + scope, null);
        }
        return scope;
    };

    this.tenantKey = function() {
        let tkey = 'senior';
        if (process.env.TENANT_KEY) {
            tkey = process.env.TENANT_KEY;
        } else {
            logger.log('Variável de ambiente TENANT_KEY não encontrada. Será utilizado o valor padrão ' + tkey, null);
        }
        return tkey;
    };

    this.allowInsecureSSL = function() {
        let allow = true;
        if (process.env.ALLOW_INSECURE_SSL) {
            allow = process.env.ALLOW_INSECURE_SSL == "S";
        } else {
            logger.log('Variável de ambiente ALLOW_INSECURE_SSL não encontrada. Será utilizado o valor padrão ' + allow, null);
        }
        return allow;
    };
    
    this.getG7ApiBase = function() {
        let apiBase = 'https://leaf.interno.senior.com.br:8243/t/senior.com.br/bridge/1.0/rest';
        if (process.env.G7_API_BASE) {
            apiBase = process.env.G7_API_BASE;
        } else {
            logger.log('Variável de ambiente G7_API_BASE não encontrada. Será utilizado o valor padrão ' + apiBase, null);
        }
        return apiBase;
    };

    this.getHcmApiBase = function() {
        let apiBase = 'https://platfotm.senior.com.br:8443/hcm-api';
        apiBase = "https://hcm-api.senior.com.br/frontend-api";
        if (process.env.HCM_API_BASE) {
            apiBase = process.env.HCM_API_BASE;
        } else {
            logger.log('Variável de ambiente HCM_API_BASE não encontrada. Será utilizado o valor padrão ' + apiBase, null);
        }
        return apiBase;
    };

    this.getSamApiBase = function() {
        let apiBase = 'https://platform.senior.com.br/t/senior.com.br/sam/1.0/';
        if (process.env.SAM_API_BASE) {
            apiBase = process.env.SAM_API_BASE;
        } else {
            logger.log('Variável de ambiente SAM_API_BASE não encontrada. Será utilizado o valor padrão ' + apiBase, null);
        }
        return apiBase;
    };

    this.awsAccessKey = function() {
        let key = '';
        if (process.env.AWS_ACCESS_KEY) {
            key = process.env.AWS_ACCESS_KEY;
        } else {
            logger.log('Variável de ambiente AWS_ACCESS_KEY não encontrada.', null);
        }
        return key;
    };

    this.awsSecretAccessKey = function() {
        let key = '';
        if (process.env.AWS_SECRET_ACCESS_KEY) {
            key = process.env.AWS_SECRET_ACCESS_KEY;
        } else {
            logger.log('Variável de ambiente AWS_SECRET_ACCESS_KEY não encontrada.', null);
        }
        return key;
    };

    this.awsBucketName = function() {
        let name = '';
        if (process.env.AWS_BUCKET_NAME) {
            name = process.env.AWS_BUCKET_NAME;
        } else {
            logger.log('Variável de ambiente AWS_BUCKET_NAME não encontrada.', null);
        }
        return name;
    };

    this.mongodbURL = function() {
        let baseURL = 'mongodb://ibm_cloud_2a9d37af_f5d0_4ae4_9494_0ab199ca3a49:a72565c509fb1b3126dedd7fe3f837904e69e82a5a38023b825d05a16a840772@356013ac-a617-4096-bb83-acb74eb728e8-0.0135ec03d5bf43b196433793c98e8bd5.databases.appdomain.cloud:31178,356013ac-a617-4096-bb83-acb74eb728e8-1.0135ec03d5bf43b196433793c98e8bd5.databases.appdomain.cloud:31178/ibmclouddb?authSource=admin&replicaSet=replset';
        if (process.env.MONGODB_URL) {
            baseURL = process.env.MONGODB_URL;
        } else {
            logger.log('Variável de ambiente MONGODB_URL não encontrada. Será utilizado o valor padrão ' + baseURL, null);
        }
        return baseURL;
    };

    this.mongodbDBName = function() {
        let dbname = 'sarawhatsapp';
        if (process.env.MONGODB_DBNAME) {
            dbname = process.env.MONGODB_DBNAME;
        } else {
            logger.log('Variável de ambiente MONGODB_DBNAME não encontrada. Será utilizado o valor padrão ' + dbname, null);
        }
        return dbname;
    };

    this.hostName = function() {
        let url = 'http://localhost:3000';
        if (process.env.URL_SERVER) {
            url = process.env.URL_SERVER;
        } else {
            logger.log('Variável de ambiente URL_SERVER não encontrada. Será utilizado o valor padrão ' + url, null);
        }
        return url;
    };

    this.infobipKey = function() {
        let key = null
        if (process.env.INFOBIP_KEY) {
            key = process.env.INFOBIP_KEY;
        } else {
            logger.log('Variável de ambiente INFOBIP_KEY não encontrada.', null);
        }
        return key;
    };

    this.infobipScenario = function() {
        let scenario = null;
        if (process.env.INFOBIP_SCENARIO) {
            scenario = process.env.INFOBIP_SCENARIO;
        } else {
            logger.log('Variável de ambiente INFOBIP_SCENARIO não encontrada.', null);
        }
        return scenario;
    };

    this.infobipHost = function() {
        let host = null;
        if (process.env.INFOBIP_HOST) {
            host = process.env.INFOBIP_HOST;
        } else {
            logger.log('Variável de ambiente INFOBIP_HOST não encontrada.', null);
        }
        return host;
    };

    this.botfactoryUrl = function() {
        const botFactoryUrl = process.env.BOTFACTORY_URL;
        if (!botFactoryUrl) {
            logger.log('Botfactory url not defined in environment variables.');
        }
        return botFactoryUrl;
    }

}

module.exports = EnvVariables;