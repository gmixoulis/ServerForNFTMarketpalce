const AWS = require('aws-sdk');
const secretsManager = new AWS.SecretsManager({region: 'eu-west-1'});

function getSecret(secretName) {
  return new Promise((resolve, reject) => {
    secretsManager.getSecretValue({ SecretId: secretName }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        let secret;
        if ('SecretString' in data) {
          secret = data.SecretString;
        } else {
          secret = Buffer.from(data.SecretBinary, 'base64').toString('ascii');
        }
        resolve(secret);
      }
    });
  });
}

module.exports = getSecret;