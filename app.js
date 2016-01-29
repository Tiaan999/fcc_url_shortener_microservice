'use strict';

var express = require('express');
var mongo = require('mongodb').MongoClient;

var app = express();
require('dotenv').load();

mongo.connect(process.env.MONGO_URI, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', process.env.MONGO_URI);
    //db.createCollection('websites');
    var websites = db.collection('websites');
	websites.remove({});
	console.log('All gone.');
	var web1 = {short: 1, original: 'http://www.google.com'};
	var web2 = {short: 2, original: 'http://www.facebook.com'};
	websites.insert([web1, web2], function (err, result) {
		if (err) {
			throw err;
		} else {
			console.log('First two added.\n')
			db.close();
		}
	})
  }
});

mongo.connect(process.env.MONGO_URI, function (err, db) {
  if (err) {
    console.log('Unable to connect to the mongoDB server. Error:', err);
  } else {
    console.log('Connection established to', process.env.MONGO_URI);
	var collection = db.collection('websites');
	collection.find().toArray(function(err, items) {
		if (err) {
			throw err;
		} else {
			console.log("Here's what's in the database:");
			console.log(items);
			console.log('\n');
			db.close();	
		}
	});
  }
});

app.get('/*', function (req, res) {
	var received = req.params[0];
	var lastEntry = 0;
	mongo.connect(process.env.MONGO_URI, function (err, db) {
    	if (err) {
    		console.log('Unable to connect to the mongoDB server. Error:', err);
  		} else {
    		console.log('Connection established to', process.env.MONGO_URI);
			var collection = db.collection('websites');
			
			//Determine last entry in DB - Make function
			collection.count({}, function (err, last) {
				console.log('No problem yet.');
					if (err) {
						throw err;
					} else {
						console.log('No problem yet.');
						lastEntry = last;
						console.log("The last entry in the database is:" + last);
						res.send("The last entry in the database is:" + lastEntry);
						db.close();
					}
				}
			);
			
		 }
	});
	//res.send("The last entry in the database is:" + lastEntry);
});

var port = process.env.PORT;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});