// Place your server entry point code here
const args = require('minimist')(process.argv.slice(2))

// console.log(args)

const help = (`
server.js [options]

--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.

--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.

--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.

--help, -h	Return this message and exit.
`)
// If --help or -h, echo help text to STDOUT and exit
if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

args['port', 'debug', 'log', 'help'];
const port = args.port || process.env.PORT || 5000

const express = require('express');
const app = express();
const logdb = require('./src/services/database')
const fs = require('fs')
const morgan = require('morgan')



app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const server = app.listen(port, () => {
    console.log('App listening on port %PORT%'.replace('%PORT%',port))
});

if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {
    const logdir = './log/';

    if (!fs.existsSync(logdir)){
        fs.mkdirSync(logdir);
    }
    const accessLog = fs.createWriteStream( logdir+'access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

app.use( (req, res, next) => {
    // Your middleware goes here.
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referer: req.headers['referer'],
        useragent: req.headers['user-agent']
    }

 const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referer, logdata.useragent)
  next();
 });
if (args.debug == true) {
    app.get('/app/log/access', (req, res, next) => {
        try {
            const stmt = logdb.prepare('SELECT * FROM accesslog').all()
            res.status(200).json(stmt)
            } catch {
              console.error(e)
            }
    })

    app.get('/app/error', (req, res) => {
        throw new Error('Error test successful.');
    })
}

    //methods
    function coinFlip() {
        return Math.random() < 0.5 ? 'heads':'tails';
      }
    
      function coinFlips(flips) {
        if(flips < 1) {
          flips = 1;
        }
        var array = [];
        for (var i=0; i<flips; i++) {
          array.push( Math.random() < 0.5 ? 'heads':'tails');
        }
      
        return array;
      
      }
    
      function countFlips(array) {
    
        var final = { tails: 0, heads: 0 };
        for(var i = 0; i<array.length; i++) {
          if(array[i] == "heads") {
            final.heads++;
          } else if(array[i] == "tails") {
            final.tails++;
          } 
        }
        if(final.heads == 0) {
          return "{ tails: "+final.tails+" }";
        } else if(final.tails == 0) {
          return  "{ heads: "+final.heads+" }";
        }
        return final;
      
      }
    
      function flipACoin(call) {
        if(call !== 'heads' && call !== 'tails') {
          console.log("Error: no input. Usage: node guess-flip --call=[heads|tails]");
          return;
        }
        var final = { call: '', flip: '', result: '' };
        final.call = call;
        final.flip = coinFlip();
        if(final.flip == final.call) {
          final.result = 'win';
        } else {
          final.result = 'lose';
        }
        
        return final;
      }
      // end of methods


// Serve static HTML files
app.use(express.static('./public'));

app.get("/app/", (req, res, next) => {
    res.json({"message":"Your API works! (200)"});
	res.status(200);
});

app.get('/app/flip/', (req, res) => {
        res.statusCode = 200;
        let flip = coinFlip();
        res.json({"flip": flip});
        res.writeHead( res.statusCode, { 'Content-Type' : 'application/json' });  
})

app.post('/app/flip/coins/', (req, res, next) => {
    res.statusCode = 200;
    const flips = coinFlips(req.body.number)
    const count = countFlips(flips)
    res.status(200).json({"raw": flips, "summary": count})
})

app.get('/app/flips/:number', (req, res, next) => {
    res.statusCode = 200;
    const flips = coinFlips(req.params.number);
    const count = countFlips(flips);
    res.status(200).json({"raw": flips, "summary": count});
})

app.post('/app/flip/call/', (req, res, next) => {
    const game = flipACoin(req.body.guess)
    res.status(200).json(game)
})

app.get('/app/flip/call/:guess(heads|tails)/', (req, res, next) => {
    const game = flipACoin(req.params.guess)
    res.status(200).json(game)
})
/*
app.get('/app/flip/call/heads', (req, res) => {
    res.statusCode = 200;
    let result = flipACoin('heads');
    res.send(result);
    res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });  
})

app.get('/app/flip/call/tails', (req, res) => {
    res.statusCode = 200;
    let result = flipACoin('tails');
    res.send(result);
    res.writeHead( res.statusCode, { 'Content-Type' : 'text/plain' });  
})
*/

app.use(function(req, res){
    res.status(404).send('404 NOT FOUND')
});

process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});
