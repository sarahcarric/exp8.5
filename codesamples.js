//RPC server code
import { server as createServer } from 'jayson';

const server = createServer({
  getRounds: function(args, callback) {
    const userId = args.userId;
    const rounds = getRounds(userId);
    callback(null, rounds);
  }
  //Other server methods go here
});

server.http().listen(3000);

//RPC client code
import jayson from 'jayson/lib/client/browser'; // use the browser client

// create a client
const client = jayson.http({
  port: 3000
});

// invoke "getRounds"
client.request('getRounds', {userId: '6655fac37b0b15e1166a42c0'}, (err, response) => {
  if(err) throw err;
  console.log(response.result); //output user's rounds as array of JSON objects
});