const axios = require("axios");

const client = axios.create({
  baseURL: "https://server.finuniques.in/api/InstantPay",
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 20000
});

module.exports = client;
