const express = require('express');
const router = express.Router();

router.get('/users/:userId', (req, res) => {
    res.send(`Return user object with id ${req.params.userId}`);
});

/* post, put, and delete methods analogous to those in
   Listing 18.1 are omitted. */

router.post('/users', (req, res) => {
    res.send(`Add a new user`);
});

router.post('/users/:userId/rounds', (req, res) => {
    res.send(`Add a new round for user with id ${req.params.userId}`);
});

router.put('/users/:userId/rounds/:roundId', (req, res) => {   
    res.send(`Update round ${req.params.roundId} of user ${req.params.userId}`);
});

router.delete('/users/:userId/rounds/:roundId', (req, res) => {    
    res.send(`Delete round with id ${req.params.id}`);
});

const myRouter = require('./myrouter.js');
// ...
application.use('/myrouter', myRouter);

module.exports = router;