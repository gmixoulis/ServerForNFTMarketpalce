const mongoose = require("mongoose");

// Define the sub-document schema for "cert_profiles"
const certProfileSchema = new mongoose.Schema({
  exam_taker: { type: String, required: true, unique: true },
  mint_pass_holder: { type: String, required: true },
  mint_pass_balanceOf: { type: String },
  name: { type: String },
  kyc_verification: {
    type: String,
    enum: ["Completed", "Pending", "Failed", "Unverified"],
  },
  ens_verification: {
    type: String,
    enum: ["Completed", "Pending", "Failed", "Unverified"],
  },
  wallet_allowed_to_mint_cert: {
    type: String
   
  },
  user_confirmed: { type: Boolean },
  user_confirmed_time: { type: Date },
  token_id: { type: Number },
});

// Define the main schema
const certificateSchema = new mongoose.Schema({
  type: { type: String, required: true },
  action: { type: String, required: true },
  mint_pass_contract_addr: { type: String, required: true },
  mint_pass_allowlist_count: { type: Number, required: true },
  mint_pass_holders_count: { type: Number, required: true },
  semester: { type: String, required: true },
  year: { type: Number, required: true },
  course_code: { type: String, required: true },
  course_name: { type: String, required: true },
  cert_profiles: [certProfileSchema], // Array of sub-documents
});

// Create and export the Certificate model
const Certificate = mongoose.model("Certificate", certificateSchema);
const CertificateSubmitted = mongoose.model("CertificateSubmitted", certificateSchema);

module.exports = {Certificate, CertificateSubmitted};
