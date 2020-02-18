const https = require('https');

const sendRes = (status, body) => {
  var response = {
    statusCode: status,
    headers: {
      'Content-Type': 'application/json'
    },
    body: body
  };
  return response;
};

function getToken(defaultToken) {
  return new Promise(resolve => {
      
    if (defaultToken) {
      console.log('defaulttoken = ' + defaultToken);
      return resolve(defaultToken);      
    }

    return resolve("No token");

  });
}


function responseDataTable(hostname, port, dataTable, dataKey, token) {
return new Promise((resolve, reject) => {
      const options = {
        hostname: hostname,
        port: port,
        path: `/t/senior.com.br/bridge/1.0/odata/platform/ecm_form/${dataTable}?$filter=` +
          encodeURIComponent(`question eq '${dataKey}'`),
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        rejectUnauthorized: false,
        requestCert: true,
        agent: false
      };
      console.log(options);
      const req = https.request(options, res => {
        res.on('data', data => {
          console.log("*************************" + data);
          let jsonResult = null;
          try {
             jsonResult = JSON.parse(data);
          } catch (err) {
            //
            console.log('Error on parser json ' + err);
            reject(data);
          }
          console.log("JSON-RESULT: " + JSON.stringify(jsonResult));
          if (!jsonResult) {
            reject(data);
          }
          else if (jsonResult.error)  {
            reject(jsonResult.error.message);
          }
          else {
            let ret = jsonResult.value[0];
            if (ret && ret.answer) {
              resolve(ret.answer);
            }
            else {
              resolve(null);
            }
          }
        });
      });
      req.on('error', error => {
        console.log("ERRO" + error);
        resolve(null);
      });
      req.end();
    });
}


module.exports.responseDataTable = responseDataTable;
module.exports.getToken = getToken;

module.exports.sendRes = sendRes;
