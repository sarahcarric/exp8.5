const express = require('express');
const app = express();
const fs = require('fs'); 
require('dotenv').config();
const port = process.env.PORT || 3000;
const userFile = './users.json';

/*************************************************************************
 * @function readUsers
 * @desc Reads the users.json file and stores the contents in 
 *      app.locals.users. If the file cannot be read, app.locals.users
 *     is set to null.
 * @param none
 * @return users object containing database if read was successful,
 *        null otherwise.
 * **********************************************************************/
function readUsers() {
  try {
    const data = fs.readFileSync(userFile);
    const users = JSON.parse(data);
    console.log("Users database successfully read from users.json file.");
    return users;
  } catch (err) {
    console.log("Error reading database from users.json file: " + err.message);
    return null;
  }
}

/*************************************************************************
 * @function writeUsers
 * @desc Writes the database to the users.json file.
 * @param users, the users object to be written to the file
 * @return {boolean} true if the write was successful, false otherwise.
 * **********************************************************************/
function writeUsers(users) {
  try {
    fs.writeFileSync(userFile, JSON.stringify(users));
    console.log("Users database successfully written to file.");
    return true;
  } catch (err) {
    console.log("Error writing users database to file: " + err.message);
    return false;
  }
}

app.locals.users = readUsers(); //Initialize users database from file

app.use((err, req, res, next) => {
  if (err) {
    res.status(err.status).send("Error in request: " + err.message);
  } else {
    next();
  }
})

app.listen(port, () => console.log(`Listening on port ${port}...`));