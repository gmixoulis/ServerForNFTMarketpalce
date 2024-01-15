const {
  Certificate,
  CertificateSubmitted,
} = require("../services/certificateSchema");
const express = require("express");
const router = express.Router();
const { encryptText } = require("../services/shortNames");
const db = require("../db");
require("dotenv").config();
// dont forget it is the certificate db name not the test
router.get("/get_certificate/:mint_pass_holder", async (req, res) => {
  await db.connect(
    process.env.DB_USER,
    process.env.DB_PASS,
    process.env.DB_HOST
  );
  const address = req.params.mint_pass_holder;
  try {
    // Fetch data based on the mint_pass_holder
    const certificates = await Certificate.findOne({
      course_code: "Course Code Value",
    });
    if (!certificates) {
      throw new Error("Collection not found");
    }
    const profiles = certificates.cert_profiles;
    for (const i of profiles) {
      if (i.mint_pass_holder == address || i.exam_taker == address) {
        i.name = encryptText(i.name);
        i.exam_taker = encryptText(i.exam_taker);
        i.mint_pass_holder = encryptText(i.mint_pass_holder);
        db.disconnect();
        res.status(200).json(i);
      }
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.post("/add-cert-profile", async (req, res) => {
  await db.connect(
    process.env.DB_USER,
    process.env.DB_PASS,
    process.env.DB_HOST
  );
  const {
    exam_taker,
    mint_pass_holder,
    name,
    kyc_verification,
    wallet_allowed_to_mint_cert,
    user_confirmed,
    ens_verification,
    user_confirmed_time,
    token_id,
  } = req.body;

  try {
    // Call balanceOf() function from the contract address 0xC5618106B3bfb2319017A3682BC79C7Af0A517a7 to determine mint_pass_balanceOf
    let mint_pass_balanceOf = mint_pass_holder; // Default to mint_pass_holder address

    // Create the cert_profile object
    const certProfile = {
      exam_taker,
      mint_pass_holder,
      mint_pass_balanceOf,
      name,
      kyc_verification,
      ens_verification,
      wallet_allowed_to_mint_cert,
      user_confirmed,
      user_confirmed_time,
      token_id,
    };

    // Find the certificate document in MongoDB based on the course code
    const courseCode = "META-511"; // Replace with the actual course code from the frontend
    const certificate = await CertificateSubmitted.findOne({
      course_code: courseCode,
    });

    if (!certificate) {
      console.error(
        `Certificate with course code ${courseCode} not found in MongoDB.`
      );
      res.status(404).json({
        error: `Certificate with course code ${courseCode} not found.`,
      });
      return;
    }
  

    // Check if the user's profile already exists in the cert_profiles array
    const existingProfileIndex = certificate.cert_profiles.findIndex(
      (profile) =>
        profile.exam_taker === exam_taker &&
        profile.mint_pass_holder === mint_pass_holder
    );

    if (existingProfileIndex !== -1) {
      // Profile already exists, return an error response
      console.error(
        "User's profile already exists in the cert_profiles array."
      );
      res.status(400).json({ error: "User's profile already exists." });
      return;
    }
    // Add the cert_profile to the cert_profiles array
    certificate.cert_profiles.push(certProfile);

    // Save the updated certificate document
    await certificate.save();

    console.log("Cert_profile added to MongoDB:", certProfile);
    res.status(200).json({ message: "Cert_profile added successfully." });
  } catch (error) {
    console.error("Error adding cert_profile to MongoDB:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;


//****************************** LISTA ME TOUS 28 VLAKES pou den exoun allowlist */