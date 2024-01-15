const AWS = require("aws-sdk");
const axios = require("axios");
require("dotenv").config();
//const db = require("./aws_get_secret");
const { Collection, CollectionMetadata } = require("./mongoSchema");

// Connect to MongoDB
/*
// SERVER
async function getENVs() {
  return await db.connectDB();
}
const envs = getENVs();
try {
  mongoose.connect(
    "mongodb+srv://" +
      envs.DB_USER +
      ":" +
      envs.DB_PASSWORD +
      "@" +
      envs.DB_HOST,
    //",
    { useNewUrlParser: true, useUnifiedTopology: true }
  );
  console.log("Connected to MongoDB");
} catch (error) {
  console.error(error);
}
mongoose.connection.on(
  "error",
  console.error.bind(console, "***********connection error:")
);

AWS.config.update({
  secretAccessKey: envs.ACCESS_SECRET,
  accessKeyId: envs.ACCESS_KEY,
  region: envs.REGION_DEV,
});

*/

/**
 * saveImage              saves an image file into s3
 * @param {*} fullname    absolute path and file name of the file to be uploaded
 * @param {*} filecontent buffer of the image file
 */
const uploadFile = async function (
  s3_creds,
  fullname,
  filecontent,
  filetype,
  metadata,
  imageuri,
  index
) {
  const s3 = new AWS.S3(s3_creds);
  return new Promise((resolve, reject) => {
    // Add a file to a Space
    const transcripts = [];
    let params = {
      Key: fullname + ".png", // absolute path of the file
      Body: filecontent,
      Bucket: "metaudev-bucket",

      ContentEncoding: "binary",
      ContentType: filetype,
    };
    // console.log(params)
    s3.putObject(params, function (err, data) {
      if (err) {
      } else {
        //console.log("uploaded: " + fullname + ".png");
      }
    });
    if (imageuri.transcripts != "none") {
      const arrayOfObjects = imageuri.transcripts;
      for (let i = 0; i < arrayOfObjects.length; i++) {
        const object = arrayOfObjects[i];

        params = {
          Key: fullname + object.format, // absolute path of the file
          Body: object.value,
          Bucket: "metaudev-bucket",
        };
        transcripts.push({
          type: object.format,
          value: process.env.CLOUDFRONT_DEV + fullname + object.format,
        });
        // console.log(params)
        s3.putObject(params, function (err, data) {
          if (err) {
            console.trace(err);
          } else {
            //console.log("******uploaded: " + params.Bucket + object.format);
          }
        });
      }
    }

    const buf = Buffer.from(JSON.stringify(metadata));

    const data = {
      Bucket: "metaudev-bucket",
      Key: fullname + ".json",
      Body: buf,
      ContentEncoding: "base64",
      ContentType: "application/json",
    };

    s3.upload(data, function (err, data) {
      if (err) {
        console.log(err);
        console.log("Error uploading data: ", data);
      } //else console.log(`Successfully uploaded! ${data.Location}`);
    });

    const newNFT = {
      tokenId: index,
      thumbnail_url: process.env.CLOUDFRONT_DEV + fullname + ".png",
      animation_url: imageuri.link,
      transcripts: transcripts,
      raw_json_uri: process.env.CLOUDFRONT_DEV + fullname + ".json",
    };

    Collection.findOne(
      { collection_address: process.env.CONTRACT_CLAIM },
      async (err, contract) => {
        if (err) {
          reject(err);
          return;
        }

        if (!contract) {
          // Create a new contract
          const newContractMeta = new CollectionMetadata({
            collection_address: process.env.CONTRACT_CLAIM,
            nft_count: 1,
          });
          const newContract = new Collection({
            collection_address: process.env.CONTRACT_CLAIM,
            nfts: [newNFT],
            meta_id: newContractMeta.id,
          });

          try {
            await newContractMeta.save();
            await newContract.save();
            resolve;
          } catch (err) {
            reject;
          }
        } else {
          // Update the existing contract by appending the new NFT
          try {
            if (contract.nfts.find((nft) => nft.tokenId === newNFT.tokenId)) {
              console.log(
                "Token *** " +
                  newNFT.tokenId +
                  " *** already exists, cannot add duplicate."
              );
              resolve(true);
            } else {
              await contract.nfts.push(newNFT);
              await CollectionMetadata.updateOne(
                { _id: contract.meta_id },
                {
                  collection_address: contract.collection_address,
                  $inc: { nft_count: 1 },
                },
                { upsert: true }
              );
              await contract.save();
              resolve();
            }
          } catch (err) {
            console.log(err);
            reject();
          }
        }
      }
    );
  });
};

const getFileFromURL = async function (imageuri) {
  // console.log (imageuri)
  return await new Promise((resolve, reject) => {
    try {
      axios
        .get(encodeURI(imageuri), { responseType: "arraybuffer" })
        .then(resolve);
    } catch (err) {
      console.trace(err);
      reject(err);
    }
  });
};

/**
 * saveImageFromUrl    gest a file from an url and saves a copy on s3 bucket
 * @param {*} imageuri full URL to an image
 * @param {*} fullname absolute path and filename of the file to be writen on s3
 */
const saveFileFromUrl = async function (s3_creds, imageuri, fullname, uri) {
  return await new Promise((resolve, reject) => {
    Collection.findOne(
      { collection_address: process.env.CONTRACT_CLAIM },
      async (err, contract) => {
        let flag = false;
        try {
          flag = contract.nfts.find((nft) => nft.tokenId === newNFT.tokenId);
        } catch {}
        if (flag) {
          console.log(
            "Token *** " +
              newNFT.tokenId +
              " *** already exists, cannot add duplicate."
          );
          return;
        } else {
          getFileFromURL(imageuri.image)
            .then((image) => {
              // console.log(image.res)
              uploadFile(
                s3_creds,
                fullname,
                Buffer.from(image.data, "utf8"),
                image.headers["content-type"],
                imageuri.metadata,
                imageuri,
                uri
              )
                .then(resolve)
                .catch(reject);
            })
            .catch((err) => {
              reject(err);
            });
        }
      }
    );
  });
};

const downloadAndUpload = async function (url, bucketName, type, fileName) {
  try {
    // Download the MP4 file
    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    // Upload the MP4 file to S3 bucket
    const s3 = new AWS.S3();
    const uploadParams = {
      Bucket: bucketName,
      Key: fileName + type,
      Body: response.data,
    };
    const uploadResult = await s3.upload(uploadParams).promise();
    console.log(`File uploaded successfully at ${uploadResult.Location}`);
  } catch (error) {
    console.log(error);
  }
};

const getTopTokenId = async (contractAddress) => {
  const contract = await Collection.query({
    collection_address: contractAddress,
  });
  if (!contract) {
    console.trace(contract);
    return;
  }

  const sortedNfts = contract.nfts.sort((a, b) => b.tokenId - a.tokenId);
  return sortedNfts[0].tokenId;
};

async function dropDB() {
  try {
    await Collection.deleteMany({});
    await CollectionMetadata.deleteMany({});
    console.log("Deleted");
  } catch (err) {
    console.log(err);
    return;
  }
  return;
}

async function validateNFTs(nft_list, nftss) {
  console.log("validate data");
  const collection = await Collection.findOne({
    collection_address: process.env.CONTRACT_CLAIM,
  });
  const tokenIds = new Set();
  const duplicates = new Set();

  // Check for duplicates and add tokenIds to the Set
  collection.nfts.forEach((nft) => {
    if (tokenIds.has(nft.tokenId)) {
      duplicates.add(nft.tokenId);
    } else {
      tokenIds.add(nft.tokenId);
    }
  });

  // Remove duplicates
  if (duplicates.size > 0) {
    collection.nfts = collection.nfts.filter(
      (nft) => !duplicates.has(nft.tokenId)
    );
    await collection.save();
  }

  // Create NFTs for tokenIds 1 to length if they don't exist
  for (let i = 1; i <= nft_list.length; i++) {
    if (!tokenIds.has(i) && i != 4) {
      const imageuri = nft_list[i - 1];
      console.log("tokenID: " + i, imageuri);
      let transcripts = [];
      if (nftss[i].transcripts != "none") {
        const arrayOfObjects = nftss[i].transcripts;
        for (let i = 0; i < arrayOfObjects.length; i++) {
          const object = arrayOfObjects[i];

          params = {
            Key: fullname + object.format, // absolute path of the file
            Body: object.value,
            Bucket: "metaudev-bucket",
          };
          transcripts.push({
            type: object.format,
            value: process.env.CLOUDFRONT_DEV + fullname + object.format,
          });
        }
      }

      const nft = {
        tokenId: i + 1,
        thumbnail_url:
          process.env.CLOUDFRONT_DEV +
          process.env.CONTRACT_CLAIM +
          "/" +
          (i + 1) +
          "/" +
          "media" +
          ".png",
        animation_url: nftss[i].link,
        transcripts: transcripts,
        raw_json_uri:
          process.env.CLOUDFRONT_DEV +
          "/" +
          process.env.CONTRACT_CLAIM +
          "/" +
          (i + 1) +
          "/" +
          "media" +
          ".json",
      };
      collection.nfts.push(nft);
    }
  }

  await collection.save();
}

async function removeDuplicateCollections() {
  const collections = await Collection.aggregate([
    {
      $group: {
        _id: "$collection_address",
        count: { $sum: 1 },
        nft_count: { $sum: "$nfts.length" },
        ids: { $push: "$_id" },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $sort: {
        nft_count: -1,
      },
    },
  ]);

  for (const collection of collections) {
    const idsToRemove = collection.ids.slice(0, -1);
    await Collection.deleteMany({ _id: { $in: idsToRemove } });
  }

  const metadatas = await CollectionMetadata.aggregate([
    {
      $group: {
        _id: "$collection_address",
        count: { $sum: 1 },
        nft_count: { $sum: "$nft_count" },
        ids: { $push: "$_id" },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
    {
      $sort: {
        nft_count: -1,
      },
    },
  ]);

  for (const metadata of metadatas) {
    const idsToRemove = metadata.ids.slice(0, -1);
    await CollectionMetadata.deleteMany({ _id: { $in: idsToRemove } });
  }
}
module.exports = {
  uploadFile,
  getFileFromURL,
  saveFileFromUrl,
  downloadAndUpload,
  getTopTokenId,
  dropDB,
  validateNFTs,
};
