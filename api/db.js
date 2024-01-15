const mongoose = require("mongoose");
const cfg = require("./config");

const uri = `mongodb+srv://${cfg.db.user}:${cfg.db.pass}@${cfg.db.host}`;

let db;

const connect = async (user, pass, host) => {
  const uri = `mongodb+srv://${user}:${pass}@${host}`;
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", () => {
    console.log("Connected to MongoDB");
  });
};

const disconnect = async () => {
  console.log("disconnected");
  await mongoose.disconnect();
};

/* ---------- SCHEMA ---------- */
const userSchema = new mongoose.Schema({
  public_key: { type: String, unique: true },
  nonce: { type: String, unique: true },
  roles: [String],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Create indices
userSchema.index({ public_key: -1 }, { unique: true });
userSchema.index({ nonce: -1 }, { unique: true });

// Create model
const Users = mongoose.model("User", userSchema);

module.exports = { Users, connect, disconnect };
