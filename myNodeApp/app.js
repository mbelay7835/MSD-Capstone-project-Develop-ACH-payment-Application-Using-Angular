var express = require('express');
const cors = require('cors');
const bodyParser = require("body-parser")
const paymentRoute = require('./routes/payment');

var app = express();

app.use(cors());
app.use(bodyParser.json())
app.use('/api/v1', paymentRoute);

app.listen(3000, () => {
  console.log("server running...on url http://localhost:" + 3000);
})
