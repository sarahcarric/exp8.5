const express = require('express');
const fs = require('fs');   
const app = express();

const port = 3000;

app.get('/users/:userId', (req, res) => {
    res.send(`Return user object with id ${req.params.userId}`);
});

app.post('/users', (req, res) => {
    res.send(`Add a new user`);
});


app.route('/courses')
    .get((req, res) => {
        res.send(`Return all courses`);
    })
    .post((req, res) => {
        res.send(`Add a new course`);
    }) 
    .put((req, res) => {    
        res.send(`Update a course`);
    })
    .delete((req, res) => {    
        res.send(`Delete a course`);
    });

app.post('/users/:userId/rounds', (req, res) => {
    res.send(`Add a new round for user with id ${req.params.userId}`);
});

app.put('/users/:userId/rounds/:roundId', (req, res) => {   
    res.send(`Update round ${req.params.roundId} of user ${req.params.userId}`);
});

app.delete('/users/:userId/rounds/:roundId', (req, res) => {    
    res.send(`Delete round with id ${req.params.id}`);
});

app.use((err, req, res, next) => {
    console.log(err.stack);
    res.status(err.status).send("Runtime error occurred: " + err.message);
});



app.listen(port, () => console.log(`Listening on port ${port}...`));