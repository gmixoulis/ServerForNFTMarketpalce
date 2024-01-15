const sigUtil = require("@metamask/eth-sig-util");
const ethUtil = require("ethereumjs-util");
// https://docs.metamask.io/guide/rpc-api.html#unrestricted-methods

const encryption = async function (publicEncryptionKey, secretMessage) {
  return ethUtil.bufferToHex(
    Buffer.from(
      JSON.stringify(
        sigUtil.encrypt({
          publicKey: await publicEncryptionKey.replace(/\s+/g, "+"),
          data: JSON.stringify(await secretMessage),
          version: "x25519-xsalsa20-poly1305",
        })
      ),
      "utf-8"
    )
  );
};

module.exports = encryption;
