const mongoose = require("mongoose");

//const dynamoose = require("dynamoose");
const Schema = mongoose.Schema;
const collectionMetadataSchema = new Schema({
  collection_address: {
    type: String,
    required: true,
    unique: true,
  },

  nft_count: {
    type: Number,
    required: true,
  },
});

//deployer to deployer_address
const Transcript = new Schema({
  type: {
    type: String,
    required: true,
  },
  value: {
    type: String,
  },
});

const NFT = new Schema({
  tokenId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  thumbnail_url: {
    type: String,
    required: true,
  },
  animation_url: {
    type: String,
    required: true,
  },
  transcripts: [Transcript],
  raw_json_uri: {
    type: String,
    required: true,
  },
});

const collectionSchema = new Schema({
  collection_address: {
    type: String,
    required: true,
    unique: true,
    dropDups: true,
    index: true,
  },
  //type: String,
  nfts: [NFT],
  meta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Metadata",
  },
});

const Collection = mongoose.model("Collection", collectionSchema);
const CollectionMetadata = mongoose.model("Metadata", collectionMetadataSchema);

module.exports = { Collection, CollectionMetadata };
