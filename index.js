const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();
//middle ware
app.use(express.json());
app.use(cors());
app.get("/", (req, res) => {
  res.send("Jarins portal Api Running");
});
app.listen(port, () => {
  console.log("jarins server running on Port: ", port);
});
