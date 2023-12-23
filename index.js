const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const mg = require("nodemailer-mailgun-transport");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;
const app = express();
//middle ware
app.use(express.json());
app.use(cors());
//verify jsonwebtoken
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const accessToken = authHeader.split(" ")[1];
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}
//auth for email
const auth = {
  auth: {
    api_key: process.env.EMAIL_SENDER_KEY,
    domain: process.env.EMAIL_DOMAIN,
  },
};
const nodemailerMailgun = nodemailer.createTransport(mg(auth));

//send email
const sendEmail = (order) => {
  const { partsName, quantity, amount, name, email, paid, status } = order;

  let subject;
  let html;

  if (!paid) {
    (subject = `Your order for ${partsName} is received`),
      (html = `
          <div>
              <h2>Hello ${name}</h2>
              <p>Your order for ${partsName}, quantity ${quantity} has been placed!</p>
              <p>Please pay ${amount} to confirm the order.</p>
              <p>Thank You.</p>

              <h3>Our Address</h3>
              <p>Agrabad, Chittagong</p>
              <p>Bangladesh</p>
              <a href="https://web.programming-hero.com">unsubscribe</a>
          </div>
      `);
  } else if (status === "pending") {
    (subject = `Your order for ${partsName} is pending for shipping`),
      (html = `
          <div>
              <h2>Hello ${name}</h2>
              <p>Your order for ${partsName}, quantity ${quantity} is pending for shipping!</p>
              <p>Thank You.</p>

              <h3>Our Address</h3>
              <p>Agrabad, Chittagong</p>
              <p>Bangladesh</p>
              <a href="https://web.programming-hero.com">unsubscribe</a>
          </div>
      `);
  } else if (status === "shipped") {
    (subject = `Your order for ${partsName} is shipped`),
      (html = `
          <div>
              <h2>Hello ${name}</h2>
              <p>Your order for ${partsName}, quantity ${quantity} is shipped!</p>
              <p>Thank You for being with us.</p>

              <h3>Our Address</h3>
              <p>Agrabad, Chittagong</p>
              <p>Bangladesh</p>
              <a href="https://web.programming-hero.com">unsubscribe</a>
          </div>
      `);
  }

  const emailClient = {
    from: process.env.EMAIL_SENDER,
    to: email,
    subject: subject,
    html: html,
  };

  nodemailerMailgun.sendMail(emailClient, (err, info) => {
    if (err) {
      console.log(`Error: ${err}`);
    } else {
      console.log(`Response: ${info}`);
    }
  });
};
//mongodb connection setup
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
    const usersCollection = client.db("partsBd").collection("user");
    const ordersCollection = client.db("partsBd").collection("order");
    // const paymentsCollection = client.db("partsBd").collection("payment");
    // const reviewsCollection = client.db("partsBd").collection("review");

    //USER:Get all user
    app.get("/user", verifyJWT, async (req, res) => {
      const user = await usersCollection.find().toArray();
      res.send(user);
    });
    //USER: Find specific user by email
    app.get("/user/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send({ user });
    });

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

    //
    //ORDERs
    app.get("/order", async (req, res) => {
      const result = await ordersCollection.find().toArray();
      res.send(result);
    });
    app.post("/order", async (req, res) => {
      const order = req.body;
      const filter = { _id: new ObjectId(order.partsId) };
      const parts = await partsCollection.findOne(filter);
      const currentAvailable = parts.available - order.quantity;
      const updatedDoc = { $set: { available: currentAvailable } };
      await partsCollection.updateOne(filter, updatedDoc);
      const result = await ordersCollection.insertOne(order);
      if (result.insertedId) {
        sendEmail(order);
        res.send({ success: true, message: "Order Confirmed! Pay Now" });
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
