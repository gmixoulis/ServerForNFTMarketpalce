const { Collection, CollectionMetadata } = require("./nftSchema");
const fetch = require("node-fetch");
async function getNFTs(contract_address) {
  try {
    const collection = await Collection.findOne({
      collection_address: contract_address,
    });
    if (!collection) {
      throw new Error("Collection not found");
    }

    const nfts = collection.nfts;
    const nftDicts = await Promise.all(
      nfts.map(async (nft) => {
        const metadata = await fetch(nft.raw_json_uri).then((response) => response.json());
        if (metadata.name !== "Placeholder Token") {
          const attrs = metadata.attributes.reduce((prev, curr) => ({
            ...prev,
            [curr.trait_type]: curr.value,
          }));
          if (metadata.external_url == "undefined") {
            metadata.external_url = false;
          }
          let transcripts = 'none';
      try {
        if (typeof metadata.transcripts != "undefined") {
          transcripts = metadata.transcripts.properties.formats;
        }
      } catch (err) {
        console.log(err);
      }

          return {
            image: metadata.image_url,
            name: metadata.name,
            course: attrs["Course Code"],
            cname: attrs["Course Name"],
            semester: attrs["Semester"],
            year: attrs["Year"],
            description: metadata.description,
            uri: nft.tokenId,
            link: metadata.external_url,
            image: metadata.image_url,
            type: attrs["Document Type"],
            transcripts: transcripts,
            metadata: metadata,
            attrs: attrs,
          };
        }
      })
    );

    return { nft_values: nftDicts };
  } catch (err) {
    console.error(err);
    return null;
  }
}

module.exports = getNFTs;
