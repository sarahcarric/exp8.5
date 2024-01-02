const express = require('express');
const bodyParser = require('body-parser');
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
app.use(bodyParser.json());

/*************************************************************************
 * @route GET /users/:userId
 * @desc Get user object with specified id
 * @param req - the request object
 * @param res - the response object
 * @return status 200 and object containing the user with the specified id 
 *         or status 500 if users database cannot be accessed
 * **********************************************************************/
app.get('/users/:userId', (req, res, next) => {
  //res.send(`Return user object with id ${req.params.userId}`);
  if (app.locals.users) {
    if (!Object.hasOwn(app.locals.users,req.params.userId)) {
      res.status(404).send(`User with id ${req.params.userId} not found`);
    } else {
      res.status(200).json(app.locals.users[req.params.userId])
    }   
  } else {
    res.status(500).send("Users database cannot be accessed. Contact the system administrator.");
  }
});

/*************************************************************************
 * @route POST /users
 * @desc Add user object in message body to the users database
 * @param req - the request object
 * @param res - the response object
 * @return status 201 if new user with specified id is added to database,
 *         or status 500 if users database cannot be accessed
 * **********************************************************************/
app.post('/users', (req, res) => {
  if (!app.locals.users) {
        res.status(500).send("Users database cannot be accessed. Contact the system administrator.");
        return;
  }
  console.log("In POST with body: " + JSON.stringify(req.body));
  if (!Object.hasOwn(req.body,"accountInfo" || 
      !Object.hasOwn(req.body.accountInfo,"email") || 
      !Object.hasOwn(req.body.accountInfo,"password") ||
      !Object.hasOwn(req.body.accountInfo,"securityQuestion") ||
      !Object.hasOwn(req.body.accountInfo,"securityAnswer"))) {
    res.status(400).send("User account is missing required email, password, security question and/or security answer.");
    return;
  }
  if (Object.hasOwn(app.locals.users,req.body.accountInfo.email)) {
    res.status(400).send(`User with id ${req.body.accountInfo.email} already exists in database`);
    return;
  }
  app.locals.users[req.body.accountInfo.email] = req.body;
  if (writeUsers(app.locals.users)) {
    res.status(201).send(`User with id ${req.body.accountInfo.email} added to database`);
  } else {
    res.status(500).send(`Error occurred when attempting to add user with id ${req.body.acountInfo.email} to the database`);
  }
});

/*************************************************************************
 * @route DELETE /users/:userId/rounds/:roundId
 * @desc Delete from the users database the round identified by roundId for
 *       user specified by userId
 * @param req - the request object
 * @param res - the response object
 * @return status 200 if round was deleted from users database,
 *         or status 500 if users database cannot be accessed
 * **********************************************************************/
app.delete('/users/:userId/rounds/:roundId', (req, res) => {    
  if (!app.locals.users) {
    res.status(500).send("Users database cannot be accessed. Contact the system administrator.");
    return;
  }
  if (!Object.hasOwn(app.locals.users,req.params.userId)) {
    res.status(400).send(`No user with id ${req.params.userId} exists in database`);
    return;
  }
  if (!Object.hasOwn(app.locals.users[req.params.userId],"rounds") ||
      !Array.isArray(app.locals.users[req.params.userId].rounds)) {
    res.status(400).send(`No rounds exist for user with id ${req.params.userId}`);
    return;
  }
  const rounds = app.locals.users[req.params.userId].rounds;
  let i;
  for (i = 0; i < rounds.length; i++) {
    if (Number(rounds[i].roundNum) === Number(req.params.roundId)) {
      break;
    }
  }
  if (i === rounds.length) {
    res.status(404).send(`No round with id ${req.params.roundId} exists for user ${req.params.userId}`);
  }
  rounds.splice(i,1);
  if (writeUsers(app.locals.users)) { 
    res.status(200).send(`Round with id ${req.params.roundId} deleted for user ${req.params.userId}`);
  } else {
    res.status(500).send("Error occurred when attempting to update database. .");
  } 
});

/*************************************************************************
 * @desc Middleware to gracefully handle errors. If an error occurs,
 *      the error message is returned to the client in the response.
 * @param err - the error object
 * @returns: status and error message if error exists; otherwise, it
 *          passes control to the next middleware function
 * **********************************************************************/
app.use((err, req, res, next) => {
  if (err) {
    res.status(err.status).send("Error in request: " + err.message);
  } else {
    next();
  }
})

/* Listen for requests on port */
if (app.locals.users) {
  app.listen(port, () => console.log(`Listening on port ${port}...`));
} else {
  console.log("Server not started. Users database could not be read.");
}