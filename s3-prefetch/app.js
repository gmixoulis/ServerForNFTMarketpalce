require("dotenv").config();
const express = require("express");
const fetchers = require("./Fetchers");
const app = express();
app.listen(3002);
const db = require("./db");
const awsf = require("./aws_send");
//const db = require("./aws_get_secret");

//localhost
const contractAddress = process.env.CONTRACT_TOKEN;
const contractClaim = process.env.CONTRACT_CLAIM;
const s3_creds = {
  secretAccessKey: process.env.ACCESS_SECRET,
  accessKeyId: process.env.ACCESS_KEY,
  region: process.env.REGION_DEV,
};
const BUCKET = process.env.BUCKET;
const CONTRACT_CLAIM = process.env.CONTRACT_CLAIM;

const pLimit = require("p-limit");
const limit = pLimit(5); // Limit to 5 concurrent requests

/*

//server
const envs = db.connectDB();
const contractAddress = envs.CONTRACT_TOKEN;
const contractClaim = envs.CONTRACT_CLAIM;
const s3_creds = {
  secretAccessKey: envs.ACCESS_SECRET,
  accessKeyId: envs.ACCESS_KEY,
  region: envs.REGION_DEV,
};
const BUCKET = process.env.BUCKET;
const CONTRACT_CLAIM = envs.CONTRACT_CLAIM;
*/
app.get("/upload_courses", async (req, res) => {
  //const nft = await fetchers.GetTokens();
  const nft = await fetchers.getAllNFTs();
  const tokenid = nft.uri;

  try {
    await awsf.saveFileFromUrl(
      s3_creds,
      nft,
      contractAddress + "/" + tokenid + "/" + "media"
    );
  } catch (err) {
    console.trace(err);
  }
});

app.get("/run_fetch", async (req, res) => {
  try {
    const uris = await fetchers.GetAllUris(1);
    await db.connect(
      process.env.DB_USER,
      process.env.DB_PASS,
      process.env.DB_HOST
    );
    let nftss = [];
    const requests = uris.map((item, index) => {
      return limit(async () => {
        try {
          let nft = await fetchers.getAllNFTs(item);
          nftss.push(nft);
          if (typeof nft != "undefined") {
            try {
              await awsf.saveFileFromUrl(
                s3_creds,
                nft,
                contractClaim + "/" + (index + 1) + "/" + "media",
                index + 1
              );
            } catch (err) {
              console.log(err);
            }
          }
        } catch (err) {
          console.log(err);
        }
      });
    });

    await Promise.allSettled(await Promise.all(requests), { concurrency: 5 });

    await awsf.validateNFTs(uris, nftss);

    res.send("<h1>ALL GOOD!</h1>");
  } catch (err) {
    console.log(err);
  } finally {
    await db.disconnect();
  }
});

app.get("/upload_pdf_video", async (req, res) => {
  //const nft = await fetchers.GetTokens();
  const uris = await fetchers.GetAllUris(1);
  uris.forEach(async (item, index) => {
    let nft = await fetchers.getAllNFTs(item);

    if (nft != undefined) {
      try {
        await awsf.downloadAndUpload(
          nft.link,
          BUCKET,
          nft.type,
          contractClaim + "/" + (index + 1) + "/" + "media."
        );
      } catch (err) {
        console.trace(err);
      }
    }
  });
});

app.get("/run_fetch_from_number", async (req, res) => {
  const number = awsf.getTopTokenId(CONTRACT_CLAIM);
  const uris = await fetchers.GetAllUris(number + 1);
  if (uris === 0) {
    return;
  }

  uris.forEach(async (item, index) => {
    let nft = await fetchers.getAllNFTs(item);
    if (typeof nft != "undefined") {
      try {
        await awsf.saveFileFromUrl(
          s3_creds,
          nft,
          contractClaim + "/" + (index + 1) + "/" + "media",
          index + 1
        );
      } catch (err) {
        console.trace(err);
      }
    }
  });
});
