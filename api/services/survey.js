const { Users } = require("../db");
const { Exam, UserExamMetadata } = require("./examSchema");
const CryptoJS = require("crypto-js");

function msToTime(duration) {
  var milliseconds = Math.floor((duration % 1000) / 100),
    seconds = Math.floor((duration / 1000) % 60),
    minutes = Math.floor((duration / (1000 * 60)) % 60),
    hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
}

function computeResults(answers) {
  // TODO: Handle all survey pages (?)
  const CryptoJS = require("crypto-js");

  const surveySchema1 = require("../data/data_answers.json");
  const surveySchema = JSON.parse(
    CryptoJS.AES.decrypt(surveySchema1.survey, process.env.AES_KEY).toString(
      CryptoJS.enc.Utf8
    )
  );
  console.log(surveySchema);
  if (
    surveySchema.pages[0].elements
      .map((x) => x.name)
      .sort()
      .join() !== Object.keys(answers).sort().join()
  )
    throw new Error("Survey schema questions and answers do not match.");

  const answerValues = Object.values(answers);
  const correctAnswers = surveySchema.pages[0].elements.map(
    (x) => x.correctAnswer
  );

  let count = 0;
  for (let i = 0; i < answerValues.length; i++)
    if (typeof correctAnswers[i] === "string")
      count += correctAnswers[i] === answerValues[i];
    else
      count +=
        correctAnswers[i].filter((x) => answerValues[i].includes(x)).length /
        correctAnswers[i].length;

  return Math.round((count * 100) / correctAnswers.length);
}

async function verifyJwt(token) {
  let payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
  const { public_key, roles } = payload;
  const user = await Users.findOne({ public_key, roles });
  if (user) {
    return user.public_key;
  }
  throw new Error(
    'Failed to verify JWT. User with public key "' +
      payload.public_key +
      '" not found.'
  );
}

async function verifyAddress(senderAddress) {
  var user;
  try {
    user = await Users.findOne({ public_key: senderAddress });
  } catch (err) {
    return new Error(err);
  }
  return user.public_key == senderAddress;
}

async function userExists(senderAddress) {
  var user;
  try {
    await Exam.findOne(
      { collection_address: process.env.CONTRACT_CLAIM },
      async (err, contract) => {
        try {
          user = await contract.users.find(
            (user) => user.user_address === senderAddress
          );

          return user != "undefined";
        } catch (e) {
          return true;
        }
      }
    );
  } catch (err) {
    return false || user != "undefined";
  }
  return false || user != "undefined";
}

async function exam2DB(json) {
  const newUser = {
    user_address: json.user_address,
    answers: json.exam,
    encrypted_answers: json.encrypted_answers,
    score: json.score,
    signature: json.signature,
    user_exam_meta_id: json.meta_id,
  };
  const decrypted = require("../data/exam.json");
  //const decrypted = JSON.parse(encrypted );
  Exam.findOne(
    { collection_address: process.env.CONTRACT_CLAIM },
    async (err, contract) => {
      if (err) console.trace(err);
      if (!contract) {
        const newContract = new Exam({
          collection_address: process.env.CONTRACT_CLAIM,
          users: [newUser],
          tokenid: decrypted.ExamID,
          attempts_allowed: decrypted.attempts_allowed,
          grade_to_pass: decrypted.gend_to_pass,
          language: decrypted.language,
          opens: decrypted.Opens,
          closes: decrypted.Closes,
        });

        try {
          await newContract.save();
        } catch (err) {
          console.log(err);
          return;
        }
        console.log("New user created and added successfully");
      } else {
        try {
          if (
            contract.users.find(
              (user) => user.user_address === newUser.user_address
            )
          )
            console.log(" Id already exists, cannot add duplicate.");
          //todo return a json with an error message to user
          else {
            contract.users.save(newUser);

            await contract.save();
          }
        } catch (err) {
          throw new Error(err);
        }
      }
    }
  );
}

async function getUserExamMetadataId(user_address) {
  try {
    const userExamMetadata = await UserExamMetadata.findOne({
      user_address: user_address,
    });
    if (userExamMetadata) {
      return userExamMetadata._id;
    } else {
      throw new Error("User exam metadata not exist");
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getUserStartDate(user_address) {
  try {
    const userExamMetadata = await UserExamMetadata.findOne({
      user_address: user_address,
    });

    if (userExamMetadata) {
      return userExamMetadata.startDate;
    } else {
      try {
        throw new Error("User exam metadata not exist");
      } catch (e) {
        next(e);
      }
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

async function getUserxpub(user_address) {
  try {
    const userExamMetadata = await UserExamMetadata.findOne({
      user_address: user_address,
    });
    if (userExamMetadata) {
      return userExamMetadata.xpub;
    } else {
      throw new Error("User exam metadata not exist");
    }
  } catch (err) {
    console.log(err);
    throw err;
  }
}

const initializeUserExamMetadata = async ({
  user_address,
  startDate,
  exam_id,
  smartContractAddress,
  xpub,
  cutofDate,
}) => {
  try {
    const newUserExamMetadata = new UserExamMetadata({
      user_address: user_address,
      startDate: startDate,
      exam_id: exam_id,
      cutofDate: cutofDate,
      smartContractAddress: smartContractAddress,
      xpub: xpub,
    });
    await newUserExamMetadata.save();
  } catch (err) {
    const userExamMetadata = await UserExamMetadata.findOne({
      user_address: user_address,
    });
    if (!userExamMetadata.isSubmitted) {
      console.log("use exists but has not submitted yet");
      return true;
    } else {
      throw err;
    }
  }
};

const updateUserExamMetadata = async ({
  user_address,
  endDate,
  finalGrade,
  duration,
  lateSubmission,
}) => {
  try {
    const userExamMetadata = await UserExamMetadata.findOne({
      user_address: user_address,
    });
    if (!userExamMetadata) {
      throw new Error("User exam metadata does not exist");
    }
    if (userExamMetadata.endDate || userExamMetadata.finalGrade) {
      throw new Error("End date and final grade are already filled");
    }
    userExamMetadata.endDate = endDate;
    userExamMetadata.finalGrade = finalGrade;
    userExamMetadata.duration = duration;
    userExamMetadata.lateSubmission = lateSubmission;
    userExamMetadata.isSubmitted = true;
    const savedUserExamMetadata = await userExamMetadata.save();
    return savedUserExamMetadata._id;
  } catch (err) {
    console.log(err);
    throw err;
  }
};

module.exports = {
  computeResults,
  verifyAddress,
  exam2DB,
  getUserExamMetadataId,
  initializeUserExamMetadata,
  updateUserExamMetadata,
  verifyJwt,
  msToTime,
  getUserStartDate,
  getUserxpub,
  userExists,
};
