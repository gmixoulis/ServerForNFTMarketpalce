const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const cfg = require("../config");

mongoose.set("strictQuery", false);
// Connect to MongoDB

const Users = new Schema({
  user_address: {
    type: String,
    required: true,
    unique: true,
  },
  answers: {
    type: String,
    required: true,
  },
  encrypted_answers: {
    //public key cryptography of user answers
    type: String,
  },
  score: {
    type: Number,
    required: true,
  },
  signature: {
    type: String,
    required: true,
    unique: true,
  },

  user_exam_meta_id: {
    //********************************************** */
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserExamMetadataSchema",
  },
});

const ExamSchema = new Schema({
  collection_address: {
    type: String,
    required: true,
    unique: true,
  },
  tokenid: {
    type: String,
    required: true,
    unique: true,
  },
  cutoffDate: {
    type: Date,
    required: false,
    unique: true,
  },
  attempts_allowed: { type: Number, required: false, unique: true },
  grade_to_pass: { type: Number, required: false, unique: true },
  language: { type: String, required: false, unique: true },
  opens: { type: Date, required: false, unique: true },
  closes: { type: Date, required: false, unique: true },

  //type: String,
  users: [Users],
});
//toDO cuy of date after this timestamp, do not let him get the survey
const UserExamMetadataSchema = new Schema({
  user_address: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: String,
    required: false,
  },
  lateSubmission: {
    type: Boolean,
    required: false,
  },
  isSubmitted: {
    type: Boolean,
    default: false,
  },
  xpub: {
    //this is the extendend public key of the user
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: false,
  },
  exam_id: {
    type: String,
    required: true,
    // unique: true,
  },
  smartContractAddress: {
    type: String,
    required: true,
    // unique: true,
  },
  finalGrade: { type: Number },
});

/*
userExamMetadataSchema

-publcaddress
-startDate
-endDate        required: false
-exam_id
-smartContractAddress   
-finalGrade     required: false


*/

const Exam = mongoose.model("Exam", ExamSchema);
const UserExamMetadata = mongoose.model(
  "UserExamMetadata",
  UserExamMetadataSchema
);
module.exports = { Exam, UserExamMetadata };
