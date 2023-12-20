const express = require("express");
const cors = require("cors");
// const jwt = require("jsonwebtoken");

require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;
const app = express();
//middle ware
app.use(express.json());
app.use(cors());

//
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.esr8cdy.mongodb.net/`;
console.log(uri);
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
//run function
async function run() {
  try {
    await client.connect();
    const partsCollection = client.db("partsBd").collection("parts");
    // const usersCollection = client.db("partsBd").collection("user");
    // const ordersCollection = client.db("partsBd").collection("order");
    // const paymentsCollection = client.db("partsBd").collection("payment");
    // const reviewsCollection = client.db("partsBd").collection("review");

    //PARTS
    app.get("/parts", async (req, res) => {
      const pageText = req.query.page;
      const sizeText = req.query.size;
      const page = parseInt(pageText);
      const size = parseInt(sizeText);
      const result = await partsCollection
        .find()
        .skip(page)
        .limit(size)
        .toArray();
      res.send({ success: true, data: result });
      console.log(result);
    });

    app.get("/parts/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const item = await partsCollection.findOne(query);
      console.log(item);
      res.send(item);
    });

    app.post("/parts", async (req, res) => {
      const parts = req.body;
      const result = await partsCollection.insertOne(parts);
      if (result.insertedId) {
        res.send({ success: true, message: "Product added successfully" });
      }
    });
  } finally {
  }
}
run().catch(console.dir);
app.get("/", (req, res) => {
  res.send("Parts Master Api Running");
});
app.listen(port, () => {
  console.log("Parts master server running on Port: ", port);
});
