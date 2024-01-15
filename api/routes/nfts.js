const express = require("express");
const router = express.Router();
const getNFTs = require("../services/nfts");
require("dotenv").config();
const db = require("../db");
router.get("/get_nfts/:contract_address", async (req, res) => {
  await db.connect(
    process.env.DB_USER,
    process.env.DB_PASS,
    process.env.DB_HOST
  );
  const contract_address = req.params.contract_address;

  console.log(contract_address);
  const nfts = await getNFTs(contract_address);
  if (nfts) {
    db.disconnect();
    res.status(200).json(nfts);
  } else {
    db.disconnect();
    res.status(500).json({ error: "NFTs not found" });
  }
});
module.exports = router;
