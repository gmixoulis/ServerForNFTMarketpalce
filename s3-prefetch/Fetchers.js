const ClaimContract = require("./abis/marketplace.json");
const TokenContract = require("./abis/course_mainet.json");
const ethers = require("ethers");
const axios = require("axios");
const fetch = require("node-fetch");
const RPC = "";
const provider = new ethers.providers.JsonRpcProvider(RPC);
const signer = provider;

module.exports = {
  getAllNFTs: async function (uri) {
    const metadata = await fetch(uri).then((response) => response.json());
    if (metadata.name !== "Placeholder Token") {
      const attrs = metadata.attributes.reduce((prev, curr) => ({
        ...prev,
        [curr.trait_type]: curr.value,
      }));
      if (metadata.external_url == "undefined") {
        metadata.external_url = false;
      }
      var transcripts = "none";
      try {
        if (typeof metadata.transcripts != "undefined") {
          transcripts = metadata.transcripts.properties.formats;
        }
      } catch (err) {
        console.log(err);
      }
      return {
        link: metadata.external_url,
        image: metadata.image_url,
        type: attrs["Document Type"],
        transcripts: transcripts,
        metadata: metadata,
      };
    }
  },

  GetAllUris: async function (number) {
    const contract = new ethers.Contract(
      ClaimContract.address,
      ClaimContract.abi,
      signer
    );

    let count = number;
    let tr;
    const uris = [];
    while (Number((tr = await contract.uri(count))) != count) {
      uris.push(await tr);
      count = count + 1;
    }
    return uris;
  },

  GetTokens: async function () {
    const contract = new ethers.Contract(
      TokenContract.address,
      TokenContract.abi,
      signer
    );

    let NFTlist = [];
    let tr = await contract.tokenURI(1);
    let meta = axios.get(tr).then(async function (response) {
      data = await response.data;

      return { metadata: data, image: data.image };
    });
    NFTlist.push(meta);
    const items = NFTlist.reduce(async (i, index) => {
      if (i !== null) {
        return {
          image: i.image,
          uri: index + 1,
          metadata: i.metadata,
        };
      }
    });

    return items;
  },
};
