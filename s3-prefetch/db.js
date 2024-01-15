const mongoose = require("mongoose");
const connect = async (user, pass, host) => {
  const uri = `mongodb+srv://${user}:${pass}@${host}`;
  const db = mongoose.connection;
  mongoose.set("strictQuery", false);
  let flag = true;
  await db.on("connected", () => {
    flag = false;
  });
  if (flag) {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", () => {
    console.log("Connected to MongoDB");
  });
};

const disconnect = async () => {
  console.log("disconnected");
  await mongoose.disconnect();
};
module.exports = { connect, disconnect };
