const fs = require("fs");
const mongoose = require("mongoose");
const { Certificate, CertificateSubmitted } = require("./certificateSchema"); // Assuming the Mongoose model is defined in a separate file
const helpers = require("../utils/helpers");
const e = require("express");
// Connect to MongoDB
const mongoUri =
  "";
mongoose
  .connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB");
    // Set the strictQuery option to false to avoid the Mongoose warning
    mongoose.set("strictQuery", false);
    readDataFromMongoDB();
    createCertificateSubmitted();
  })
  .catch((err) => console.error("Error connecting to MongoDB:", err));

async function readDataFromMongoDB() {
  try {
    // Retrieve data from "meta511" collection
    const meta511Data = await mongoose.connection.db
      .collection("meta511")
      .findOne({});

    if (!meta511Data) {
      console.error('Collection "meta511" not found in MongoDB.');
      return;
    }

    const kycData = meta511Data["Full Name"];
    const ensData = meta511Data["ENS Wallets"];

    // Retrieve data from "mint-pass-holders" collection
    const mintPassHolderData = await mongoose.connection.db
      .collection("mint-pass-holders")
      .findOne({});

    if (!mintPassHolderData) {
      console.error('Collection "mint-pass-holders" not found in MongoDB.');
      return;
    }

    // Retrieve data from "mint-pass-allowlist" collection
    const mintPassAllowlistData = await mongoose.connection.db
      .collection("mint-pass-allowlist")
      .findOne({});

    if (!mintPassAllowlistData) {
      console.error('Collection "mint-pass-allowlist" not found in MongoDB.');
      return;
    }

    console.log("Data from MongoDB successfully processed.");
    processAddresses(
      mintPassHolderData.address,
      kycData,
      ensData,
      mintPassAllowlistData.address
    );
  } catch (error) {
    console.error("Error reading data from MongoDB:", error);
  }
}
var c = 0;
var undefinedlist = [];
async function processAddresses(
  mintPassHolders,
  kycData,
  ensData,
  mintPassAllowlistData
) {
  try {
    console.log("Processing addresses...", mintPassHolders);
    if (!Array.isArray(mintPassHolders)) {
      throw new Error('Invalid data: "mintPassHolders" is not an array.');
    }

    const courseCodesMap = new Map();
    const notInAllowList = [];
    for (let i = 0; i < mintPassHolders.length; i++) {
      //278
      const address = mintPassHolders[i];
      try {
        let kycRecord = kycData.find((record) => record.address === address);

        let ensRecordWalletIndex;
        let ensRecordWallet = ensData.find((record, index) => {
          if (record["Wallet Address that the NFT was minted"] === address) {
            ensRecordWalletIndex = index;
            return true;
          }
        });

        let ensRecordAddressIndex;
        let ensRecordAddress = ensData.find((record, index) => {
          if (record.address === address) {
            ensRecordAddressIndex = index;
            return true;
          }
        });
        const ensRecord = ensRecordWallet || ensRecordAddress;

        console.log(
          "\n HEE ",
          address,
          ensRecordAddressIndex,
          ensRecordWalletIndex,
          ensData[ensRecordAddressIndex]?.[
            "Wallet Address that the NFT was minted"
          ],
          "\n"
        );

        console.log(
          c,
          "  Comparing",
          address,
          "with",
          kycRecord?.address,
          "or",
          ensRecord?.address
        );
        // if (
        //   kycRecord?.address == undefined &&
        //   ensRecord?.address == undefined
        // ) {
        //   undefinedlist.push(address);
        // }
        //if (mintPassAllowlistData.includes(address)) {
        //27
        //251: from 278 Token Holder only 251 are in Exam Takers
        c = c + 1;
        if (
          // mintPassAllowlistData.includes(
          //   ensData[ensRecordAddressIndex]?.[
          //     "Wallet Address that the NFT was minted"
          //   ]
          // )
          ensData[ensRecordAddressIndex]?.[
            "Wallet Address that the NFT was minted"
          ]
        ) {
          const courseCode = "Course Code Value"; // Replace with the actual course code from the spreadsheet

          let certificate = courseCodesMap.get(courseCode);

          const existingProfileIndex = certificate.cert_profiles.findIndex(
            (profile) => profile.mint_pass_holder === address
          );
          const exam_taker =
            ensData[ensRecordAddressIndex]?.[
              "Wallet Address that the NFT was minted"
            ];
          const mint_pass_holder = ensData[ensRecordAddressIndex]?.address;
          const contract = helpers.getEtherumContractProvider();
          const mint_pass_holder_balance = Number(
            await contract.balanceOf(ensData[ensRecordAddressIndex]?.address)
          );
          const exam_taker_balance = Number(
            await contract.balanceOf(
              ensData[ensRecordAddressIndex]?.[
                "Wallet Address that the NFT was minted"
              ]
            )
          );
          //const mint_pass_holder_balance = 0;
          const balanceOf =
            exam_taker_balance > 0
              ? exam_taker
              : mint_pass_holder_balance > 0
              ? mint_pass_holder
              : "none";
          if (existingProfileIndex === -1) {
            // If the profile does not exist, create a new profile and add it to the certificate

            await certificate.cert_profiles.push({
              exam_taker: exam_taker,
              mint_pass_holder: mint_pass_holder,
              mint_pass_balanceOf: balanceOf,
              name: kycRecord?.name || ensRecord?.name, // Add a fallback value in case name is undefined
              kyc_verification:
                kycRecord?.Verified === "Yes" || kycRecord?.Verified === "DONE"
                  ? "Completed"
                  : kycRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",

              ens_verification:
                ensRecord?.Verified === "Yes" || ensRecord?.Verified === "DONE"
                  ? "Completed"
                  : ensRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
            });
          } else {
            // If the profile already exists, update it
            certificate.cert_profiles[existingProfileIndex] = {
              exam_taker: address,
              mint_pass_holder: address,
              mint_pass_balanceOf: balanceOf,

              name: kycRecord?.name || ensRecord?.name, // Add a fallback value in case name is undefined

              kyc_verification:
                kycRecord?.Verified === "Yes" || kycRecord?.Verified === "DONE"
                  ? "Completed"
                  : kycRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
              ens_verification:
                ensRecord?.Verified === "Yes" || ensRecord?.Verified === "DONE"
                  ? "Completed"
                  : ensRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
            };
          }
        } else if (
          //mintPassAllowlistData.includes(ensData[ensRecordWalletIndex]?.address)
          ensData[ensRecordWalletIndex]?.address
        ) {
          const courseCode = "Course Code Value"; // Replace with the actual course code from the spreadsheet

          let certificate = courseCodesMap.get(courseCode);

          const existingProfileIndex = certificate.cert_profiles.findIndex(
            (profile) => profile.mint_pass_holder === address
          );
          const exam_taker = ensData[ensRecordWalletIndex]?.address;
          const mint_pass_holder =
            ensData[ensRecordWalletIndex]?.[
              "Wallet Address that the NFT was minted"
            ];
          const contract = helpers.getEtherumContractProvider();
          const exam_taker_balance = Number(
            await contract.balanceOf(ensData[ensRecordWalletIndex]?.address)
          );
          const mint_pass_holder_balance = Number(
            await contract.balanceOf(
              ensData[ensRecordWalletIndex]?.[
                "Wallet Address that the NFT was minted"
              ]
            )
          );
          //const mint_pass_holder_balance = 0;
          const balanceOf =
            exam_taker_balance > 0
              ? exam_taker
              : mint_pass_holder_balance > 0
              ? mint_pass_holder
              : "none";
          if (existingProfileIndex === -1) {
            // If the profile does not exist, create a new profile and add it to the certificate

            await certificate.cert_profiles.push({
              exam_taker: exam_taker,
              mint_pass_holder: mint_pass_holder,
              mint_pass_balanceOf: balanceOf,
              name: kycRecord?.name || ensRecord?.name, // Add a fallback value in case name is undefined
              kyc_verification:
                kycRecord?.Verified === "Yes" || kycRecord?.Verified === "DONE"
                  ? "Completed"
                  : kycRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",

              ens_verification:
                ensRecord?.Verified === "Yes" || ensRecord?.Verified === "DONE"
                  ? "Completed"
                  : ensRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
            });
          } else {
            // If the profile already exists, update it
            certificate.cert_profiles[existingProfileIndex] = {
              exam_taker: address,
              mint_pass_holder: address,
              mint_pass_balanceOf: balanceOf,

              name: kycRecord?.name || ensRecord?.name, // Add a fallback value in case name is undefined

              kyc_verification:
                kycRecord?.Verified === "Yes" || kycRecord?.Verified === "DONE"
                  ? "Completed"
                  : kycRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
              ens_verification:
                ensRecord?.Verified === "Yes" || ensRecord?.Verified === "DONE"
                  ? "Completed"
                  : ensRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
            };
          }
        } else if (kycRecord?.address || ensRecord?.address) {
          const courseCode = "Course Code Value"; // Replace with the actual course code from the spreadsheet

          let certificate = courseCodesMap.get(courseCode);

          if (!certificate) {
            // If the certificate does not exist in the map, create a new one
            certificate = new Certificate({
              type: "Type Value",
              action: "Action Value",
              mint_pass_contract_addr: "Contract Address Value",
              mint_pass_allowlist_count: 0,
              mint_pass_holders_count: 0,
              semester: "Semester Value",
              year: 2023,
              course_code: courseCode,
              course_name: "Course Name Value",
              cert_profiles: [],
            });

            courseCodesMap.set(courseCode, certificate);
          }

          const existingProfileIndex = certificate.cert_profiles.findIndex(
            (profile) => profile.mint_pass_holder === address
          );
          const exam_taker = address;
          const mint_pass_holder = address;
          const contract = helpers.getEtherumContractProvider();
          const exam_taker_balance = Number(await contract.balanceOf(address));
          // const mint_pass_holder_balance = Number(
          //   await contract.balanceOf(address)
          // );
          const mint_pass_holder_balance = 0;
          const balanceOf =
            exam_taker_balance > 0
              ? exam_taker
              : mint_pass_holder_balance > 0
              ? mint_pass_holder
              : "none";
          if (existingProfileIndex === -1) {
            // If the profile does not exist, create a new profile and add it to the certificate

            await certificate.cert_profiles.push({
              exam_taker: exam_taker,
              mint_pass_holder: mint_pass_holder,
              mint_pass_balanceOf: balanceOf,
              name: kycRecord?.name || ensRecord?.name, // Add a fallback value in case name is undefined
              kyc_verification:
                kycRecord?.Verified === "Yes" || kycRecord?.Verified === "DONE"
                  ? "Completed"
                  : kycRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",

              ens_verification:
                ensRecord?.Verified === "Yes" || ensRecord?.Verified === "DONE"
                  ? "Completed"
                  : ensRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
            });
          } else {
            // If the profile already exists, update it
            certificate.cert_profiles[existingProfileIndex] = {
              exam_taker: address,
              mint_pass_holder: address,
              mint_pass_balanceOf: balanceOf,

              name: kycRecord?.name || ensRecord?.name, // Add a fallback value in case name is undefined

              kyc_verification:
                kycRecord?.Verified === "Yes" || kycRecord?.Verified === "DONE"
                  ? "Completed"
                  : kycRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
              ens_verification:
                ensRecord?.Verified === "Yes" || ensRecord?.Verified === "DONE"
                  ? "Completed"
                  : ensRecord?.Verified == "Pending"
                  ? "Pending"
                  : "Unverified",
            };
          }
        }
        // } else {
        else {
          console.log("Not in Allowlist", address);
          notInAllowList.push(address);
        }
        //}
      } catch (error) {
        if (error && error.code === 11000) {
          // If it's a duplicate key error (code 11000), simply log the message and continue
          console.error("Duplicate key error. Skipping duplicate entries.");
        } else {
          // For other errors, log the error message
          console.error("Error:", error);
        }
      }
    }

    const certificates = Array.from(courseCodesMap.values());

    for (const certificate of certificates) {
      // Create a Set to ensure unique exam_taker values in cert_profiles
      const uniqueCertProfiles = new Set(
        certificate.cert_profiles.map((profile) => profile.exam_taker)
      );

      // Convert the Set back to an array with unique values
      certificate.cert_profiles = Array.from(uniqueCertProfiles).map(
        (exam_taker) => {
          // Find the original object in the cert_profiles array
          return certificate.cert_profiles.find(
            (profile) => profile.exam_taker === exam_taker
          );
        }
      );

      // Exclude the _id field from the update object
      const updateObject = certificate.toJSON();
      delete updateObject._id;

      try {
        // Using updateOne with upsert: true to update or insert certificates
        await Certificate.updateOne(
          { course_code: certificate.course_code },
          { $set: updateObject }, // Use $set to avoid modifying the _id field
          { upsert: true }
        );
      } catch (error) {
        if (error && error.code === 11000) {
          // If it's a duplicate key error (code 11000), simply log the message and continue
          console.error("Duplicate key error. Skipping duplicate entries.");
        } else {
          // For other errors, log the error message
          console.error("Error:", error);
        }
      }
    }
    console.log(mintPassHolders.length);
    fs.writeFileSync(
      "./notInAllowList.json",
      JSON.stringify(undefinedlist),
      function (err) {}
    );
    fs.writeFileSync("./undefinedlist.json", JSON.stringify(undefinedlist));
    fs.readFile("../data/mint-pass-holders.json", "utf8", (err, data) => {
      if (err) {
        console.error("Error reading the file:", err);
        return;
      }
      const undefinedList2 = [];
      try {
        const jsonData = JSON.parse(data);
        for (const i of jsonData.address) {
          if (i in undefinedlist) {
            undefinedList2.push(i);
          }
        }
      } catch (err) {
        console.log(err);
      }
      fs.writeFileSync("./undefinedlist2.json", JSON.stringify(undefinedList2));
      //helpers.findNonIdenticalObjects(notInAllowList, undefinedlist);
    });
    console.log("All certificates updated.");
  } catch (error) {
    console.error("Error in processAddresses:", error);
  }
}

async function createCertificateSubmitted() {
  try {
    // Check if the certificateSubmited document already exists
    const existingDocument = await CertificateSubmitted.findOne({
      type: "certificateSubmited",
    });

    if (!existingDocument) {
      // Create the initial certificateSubmited document if it doesn't exist
      const certificateSubmitedDocument = new CertificateSubmitted({
        type: "certificateSubmited",

        action: "MintCertificate",
        mint_pass_contract_addr: "0xc5618106b3bfb2319017a3682bc79c7af0a517a7",
        mint_pass_allowlist_count: "840",
        mint_pass_holders_count: "278",
        semester: "Fall",
        year: 2022,
        course_code: "META-511",
        course_name: "NFTs and the Metaverse",
        cert_profiles: [], // You can keep the cert_profiles array empty for now
      });

      // Save the document in MongoDB
      await certificateSubmitedDocument.save();
      console.log("certificateSubmited document created in MongoDB.");
    } else {
      console.log("certificateSubmited document already exists.");
    }
  } catch (error) {
    console.error("Error creating certificateSubmited document:", error);
  }
}
// Move the readDataFromMongoDB() call here, after the connection to MongoDB is established
