const express = require("express");
const userService = require("../services/user");
const router = express.Router();
const db = require("../db");

router.post("/register", async function (req, res) {
  // request body: public_key
  await db.connect(
    process.env.DB_USER,
    process.env.DB_PASS,
    process.env.DB_HOST
  );
  try {
    const [r, s] = await userService.register(req.body);
  
    await db.disconnect();
    res.status(s).send(r);
  } catch (err) {
    console.log(err);
    await db.disconnect();
    throw err;
  }
});

router.post("/signin", async function (req, res) {
  // request body: public_key, domain, nonce, msg, signature
  await db.connect(
    process.env.DB_USER,
    process.env.DB_PASS,
    process.env.DB_HOST
  );
  try {
    const [r, s] = await userService.signIn(req.body);
    await db.disconnect();
    res.status(s).send(r);
  } catch (err) {
    console.log(err);
    throw err;
  }
});

module.exports = router;
