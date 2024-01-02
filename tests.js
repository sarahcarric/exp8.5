var request = require('request');
fs = require('fs');

request({
    url: 'http://localhost:4000/users',
    method: 'POST',
    body: JSON.parse(fs.readFileSync('newuser.json')),
    json: true
}, function(error, response, body){
    console.log("**************************************************");
    console.log("Result of POST to /users with 'saved' file as body");
    console.log("**************************************************");
    if(error) {
        console.log(error);
    } else {
        console.log(response.statusCode, body);
    }
});