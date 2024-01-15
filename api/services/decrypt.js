const EthCrypto = require("eth-crypto");
const ethers = require("ethers");
require("dotenv").config();

const decryption = async function (encryptedString) {
  const privateKey = process.env.SERVER_PRIVATEKEY;
  try {
    const encryptedObject =  EthCrypto.cipher.parse(encryptedString);
    const decrypted = await EthCrypto.decryptWithPrivateKey(
      privateKey,
      encryptedObject
    );
    const decryptedPayload = JSON.parse(decrypted);
    // check signature
    const senderAddress = ethers.utils.verifyMessage(
      decryptedPayload.message,
      decryptedPayload.signature.signature
    );

    return {
      senderAddress: senderAddress,
      message: decryptedPayload.message,
      signature: decryptedPayload.signature.signature,
    };
  } catch (error) {
    console.log(error);
  }
};

module.exports = decryption;
