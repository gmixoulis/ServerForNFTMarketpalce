const cfg = require("../config");
const crypto = require("crypto");
const jose = require("jose");
const ethers = require("ethers");
const {  Users, connect, disconnect } = require("../db");

const _hasJwtTimedOut = (q) =>
  new Date() - new Date(q.updated_at) > cfg.timeout;

/* ---------- register ---------- */

async function _updateNonce(publicKey, nonce) {
  await connect(process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST);
  const t = new Date().toLocaleString("en-gr");
  const r = await Users.updateOne(
    { public_key: publicKey },
    {
      $set: { nonce, updated_at: t },
      $addToSet: { roles: "user" },
    }
  );
  console.log("IM AT _updateNonce, can you see me? ",r.nModified)
  if (r.nModified > 0) {
    console.log(
      'Changed nonce to "' +
        nonce +
        '" for user with public key "' +
        publicKey +
        '".'
    );
    await disconnect()
    return [nonce, 200];
  } else {
    const err =
      'Failed to change nonce for user with public key "' + publicKey + '".';
    console.log(err);
    return [err, 500];
  }
}

async function _insertUser(publicKey, nonce) {
  await connect(process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST);
  const t = new Date().toLocaleString("en-gr");
  const user = new Users({
    public_key: publicKey,
    nonce: nonce,
    roles: ["user"],
    created_at: t,
    updated_at: t,
  });
  try {
    await user.save();
    console.log(
      'Inserted user with public key "' +
        publicKey +
        '" and nonce "' +
        nonce +
        '".'
    );
    await disconnect()
    return [nonce, 200];
  } catch (err) {
    console.log(err);
    return [err, 500];
  }
}

async function _registerOrUpdateNonce([q, req]) {
  if (!q || _hasJwtTimedOut(q)) {
    let nonce;
    while (true) {
      nonce = crypto.randomBytes(128).toString("base64");
      if (!(await Users.countDocuments({ nonce }))) break;
    }
    return q
      ? await _updateNonce(q.public_key, nonce)
      : await _insertUser(req.public_key, nonce);
  }
  console.log(
    'Found user with public key "' +
      q.public_key +
      '" and non-expired nonce "' +
      q.nonce +
      '".'
  );
  return [q.nonce, 200];
}

async function register(req) {
  return await Users.findOne({ public_key: req.public_key }).then((q) => {
    return _registerOrUpdateNonce([q, req]);
  });
}

/* ---------- signin ---------- */

async function _generateJWT(q) {
  const t = new Date(q.updated_at).getTime();

  return await new jose.SignJWT({
    public_key: q.public_key,
    roles: q.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(t)
    .setExpirationTime(t + cfg.timeout)
    .sign(cfg.jwtSecret);
}

async function signIn(req) {
  let err;

  const q = await Users.findOne({ nonce: req.nonce });
  if (!q) {
    err = 'No matching user found for nonce "' + req.nonce + '".';
    console.log(err);
    return [err, 500];
  }
  if (q.public_key === req.public_key) {
    if (_hasJwtTimedOut(q)) {
      err = 'Token for user with public key "' + q.public_key + " has expired.";
      console.log(err);
      return [err, 303];
    }

    const hash = crypto
      .createHash("sha256")
      .update(req.domain + req.nonce + req.msg)
      .digest("hex");

    const recoveredPk = ethers.utils.verifyMessage(hash, req.signature);

    if (req.public_key === recoveredPk) {
      const jwt = await _generateJWT(q);
      console.log(
        'Generated JWT "' +
          jwt +
          '" for user with public key "' +
          q.public_key +
          '" and nonce "' +
          q.nonce +
          '".'
      );
      return [jwt, 200];
    } else {
      err =
        'Failed to match public key "' +
        q.public_key +
        '" with recovered public key "' +
        recoveredPk +
        '".';
      console.log(err);
      return [err, 500];
    }
  } else {
    err =
      'Public key "' +
      req.public_key +
      '" does not match nonce "' +
      req.nonce +
      '".';
    console.log(err);
    return [err, 500];
  }
}

module.exports = {
  register,
  signIn,
};
