const express = require('express');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use((err, req, res, next) => {
  if (err) {
    res.status(err.status).send("Error in request: " + err.message);
  } else {
    next();
  }
})

app.listen(port, () => console.log(`Listening on port ${port}...`));