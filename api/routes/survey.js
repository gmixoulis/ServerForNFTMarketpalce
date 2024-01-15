const express = require("express");
const router = express.Router();
const encrypt = require("../services/encypt");
const decrypt = require("../services/decrypt");
const surveyService = require("../services/survey");
const CryptoJS = require("crypto-js");
require("dotenv").config();
const { Users, connect, disconnect } = require("../db");

const encrypted = require("../data/data.json");
const decrypted = JSON.parse(
  CryptoJS.AES.decrypt(encrypted.survey, process.env.AES_KEY).toString(
    CryptoJS.enc.Utf8
  )
);
router.get("/schema", async (req, res) => {
  /*await connect(process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST);
   const text = require("../data/surveyArw.json");
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(text),
    process.env.AES_KEY
  ).toString();
  console.log("HELLOOO",encrypted)*/
  await connect(process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST);

  // if (new Date() < Date.parse(decrypted.cutoffDate)) {

  let jwt = req.query.jwt;
  let encryptdata;
  try {
    useraddress = await surveyService.verifyJwt(jwt);
    console.log(await surveyService.userExists(useraddress));
    if ( !surveyService.userExists(useraddress)) {
      console.log("already submitted");
      res.status(500).send({ msg: "Thank you for participating to the quiz!" });
      return;
    }
  } catch (err) {
    res.status(500).send({ msg: err.toString() });
    return;
  }
  if (!useraddress) {
    res.status(500).send({
      msg: "We could not identify you, please go back and issue agree the terms and conditions",
    });
    return;
  }
  const xpubkey = req.query.pbkey;
  encryptdata = await encrypt(xpubkey, decrypted);

  try {
    await surveyService.initializeUserExamMetadata({
      user_address: useraddress,
      startDate: new Date(),
      smartContractAddress: process.env.CONTRACT_CLAIM,
      exam_id: "METAU-511-Fall-2022",
      xpub: xpubkey,
    });
    res.send({ data: encryptdata });
  } catch (err) {
    res.status(500).send({
      msg: "You already exist in our database. Thank you for participating",
    });
    return;
  }
  //} else {
  //  console.log("OUT OF DATE");
  // }
});

router.post("/submit-survey", async (req, res) => {
  const surveyData = req.body.body;
  await connect(process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST);

  const decryptedSurvey = await decrypt(surveyData);

  if (await surveyService.verifyAddress(decryptedSurvey.senderAddress)) {
    const userScore = 0;
    /*surveyService.computeResults(
      JSON.parse(decryptedSurvey.message)
    );*/
    const endDate = new Date();
    const diffTime =
      endDate -
      new Date(
        await surveyService.getUserStartDate(decryptedSurvey.senderAddress)
      );
    const xpub = await surveyService.getUserxpub(decryptedSurvey.senderAddress);
    const lateSubmission = diffTime > 7800000;
    await surveyService.updateUserExamMetadata({
      user_address: decryptedSurvey.senderAddress,
      finalGrade: userScore,
      endDate: endDate.toUTCString(),
      duration: surveyService.msToTime(diffTime),
      lateSubmission: lateSubmission,
    });
    await surveyService.exam2DB({
      user_address: decryptedSurvey.senderAddress,
      exam: JSON.stringify(decryptedSurvey.message),
      encrypted_answers: await encrypt(
        xpub,
        JSON.stringify(decryptedSurvey.message)
      ),
      contractAddress: process.env.CONTRACT_CLAIM,
      signature: decryptedSurvey.signature,
      score: userScore,
      meta_id: await surveyService.getUserExamMetadataId(
        decryptedSurvey.senderAddress
      ),
    });
    res.send({
      userScore: userScore,
      user_address: decryptedSurvey.senderAddress,
      cname: "META-511", //decrypted.ExamID,
      lateSubmission: lateSubmission,
    });
  } else {
    res.status(500).send({
      msg: "We could not find you in our Database. Did you Signed in before?",
    });
  }
});

module.exports = router;
