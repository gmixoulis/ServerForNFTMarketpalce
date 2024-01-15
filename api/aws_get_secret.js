const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");

 function connectDB() {
  // a client can be shared by different commands.
  const client = new SecretsManagerClient({ region: "eu-west-1" }); //development * eu-west-1 *, production * us-east-1 *

  const params = {
    SecretId: "MetaU",
    VersionStage: "AWSCURRENT", // VersionStage defaults to AWSCURRENT if unspecified
  };
  const command = new GetSecretValueCommand(params);

   client.send(command).then(
    (data) => {
      console.log("HELLOO from Client",data.SecretString);
      return data.SecretString;
    },
    (error) => {
      console.log("ERROR from env", error);
    }
  );
}
module.exports = { connectDB };
