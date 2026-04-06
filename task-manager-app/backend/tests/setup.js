// const mongoose = require("mongoose");
// const agenda = require("../src/config/agenda");

// afterAll(async () => {
//   // Close DB connection
//   await mongoose.connection.close();

//   // Stop agenda jobs
//   if (agenda) {
//     await agenda.stop();
//   }
// });


const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const agenda = require("../src/config/agenda");

let mongo;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  // Connect mongoose
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key in collections) {
    await collections[key].deleteMany();
  }
});

afterAll(async () => {
  // Close DB
  await mongoose.connection.close();

  // Stop Mongo memory server
  if (mongo) {
    await mongo.stop();
  }

  // Stop agenda (VERY IMPORTANT)
  if (agenda) {
    await agenda.stop();
  }
});