'use strict';

var dbCount = 0;

var express = require('express');
var mongo = require('mongodb').MongoClient;
var https = require('https');

var app = express();
require('dotenv').load();

mongo.connect(process.env.MONGO_URI, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to ' + process.env.MONGO_URI + '\n');
    var websites = db.collection('websites');
	websites.remove({});
	//console.log('All gone.');
	var web1 = {short: 1, original: 'https://www.google.com'};
	var web2 = {short: 2, original: 'https://www.facebook.com'};
	websites.insert([web1, web2], function (err, result) {
		if (err) {
			throw err;
		} else {
			dbCount = 2;
			db.close();
		}
	});
  }
});

//Redirect to homepage for instructions
app.get('/', function (req, res) {
	res.sendFile(process.cwd() + '/index.html');
});

//Redirect favicon.ico request
app.get('/favicon.ico', function (req, res) {
    res.writeHead(200, {'Content-Type': 'image/x-icon'} );
    res.end();
});

//If something is appened to base URL, do this
app.get('/*', function (req, res) {
	var received = req.params[0];
	if (received > 0 && received <= dbCount) {
		redirectL(received, function (redirectTo) {
			res.redirect(redirectTo);
		})
		console.log('You found a winner.');
	}
	received = received.replace('http', 'https');
	console.log('Instruction received: ' + received);
	
	validLink(received, function (valid) {
		if (valid) {
			addToDB(received, function (position) {
				res.send("URL Valid. Link at: " + position);
			});
		} else {
			res.send("Error: URL invalid: " + received);
			console.log("Error: URL invalid: " + received);
		}
	});
});

var port = process.env.PORT;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});

function validLink(link, callback) {
	console.log('validLink function received: ' + link);
	var req  = https.request(link, function (res) {
		console.log('Response: ' + res.statusCode);
		if ((res.statusCode === 200) || (res.statusCode === 301) || (res.statusCode === 302)) {
			console.log("URL Valid");
			if(typeof callback == "function") {
				callback(true);
			}
  		} else {
  			console.log("URL Invalid");
  			if(typeof callback == "function") {
				callback(false);
			}
  		}
	});
	
	req.end();
	req.on('error', (e) => {
  		console.error(e);
	});
}
	
function addToDB(link, callback) {
	mongo.connect(process.env.MONGO_URI, function (err, db) {
    	if (err) {
    		console.log('Unable to connect to the mongoDB server. Error:', err);
  		} else {
    		console.log('Connection established to ' + process.env.MONGO_URI);
			var collection = db.collection('websites');
			
			//Determine if link is in DB
			collection.find({original: link}, {short: 1}).toArray(function (err, items) {
				if (err) {
					throw err;	
				} else {
					//console.log(items[0]);
					if (items[0] === undefined) {
						//Add to DB
						dbCount++;
						collection.insert([{short: dbCount, original: link}], function (err, result) {
							if (err) {
								throw err;
							} else {
								db.close();
								console.log('Added to DB. Count: ' + dbCount);
								if(typeof callback == "function") {
									callback(dbCount);
								}
							}
						});
					} else {
						//Print position in DB
						db.close();
						console.log('Link already in DB. Count: ' + items[0].short);
						if(typeof callback == "function") {
							callback(items[0].short);
						}
					}
				}
			});
		 }
	});
}

function redirectL(ref, callback) {
	mongo.connect(process.env.MONGO_URI, function (err, db) {
		if (err) {
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else {
			console.log('Connection established to ' + process.env.MONGO_URI);
			var collection = db.collection('websites');
			
			//collection.count(function (err, count) {
			//	if (err) {
			//		throw err;
			//	} else {
			//		console.log(count);
			//	}
			//});
			
			//Determine if link is in DB
			collection.find({'short': Number(ref)}, {"_id": 0, 'original': 1}, function (err, items) {
				if (err) {
					throw err;	
				} else {
					//Print position in DB
					console.log(items);
					db.close();
					
					if(typeof callback == "function") {
						callback(items);
					}
				}
			});
		}
	})
}