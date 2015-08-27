var http = require('http');
var util = require('util');
var url = require('url'); 
var express = require('express');
var mongoDB = require('mongodb').MongoClient;
var db;
var bodyParser = require('body-parser');
//application connection
var app = express();


//database connection
mongoDB.connect("mongodb://kish:kish@ds035573.mongolab.com:35573/vaultdragon-task", function(err, database) {   
if(!err) 
	{	
		this.db = database;
		console.log("Database Connection Successfull");
	}
	else
	{
		console.log("Database Connection Failed")
	}
});

//middleware
app.use(bodyParser.json({}));

app.use(bodyParser.urlencoded({
	extended: false
}));

app.use(function(request,response,next)
{
	request.db = this.db;
	next();
})

//default GET
app.get('/', function(request, response){
	response.write("Please enter Valid URL");
	response.end();
})

//default POST
app.post('/',function(request, response){
	response.writeHead(200);
	response.write("Post Method");
	response.end();
})

// GET by id or (id and time)
app.get('/get/:id', function(request, response)
{	
	var url_parts = url.parse(request.url, true);
	var query = url_parts.query;
	var q_DT = query.dateTime;

	if(!q_DT)
	{
		request.db.collection('main')
		.findOne({"id":parseInt(request.params.id)}
		,function (err, result) //select
		{
			if(!err)
			{
				response.send(result);
				response.end();
			}
			else
			{
				response.send("enter valid input");
				response.end();
			}
		});	
	}
	else
	{
		request.db.collection('history')
		.findOne({"id":parseInt(request.params.id), "dateTime":q_DT.toString()}
		,function (err, result) 
		{
			if(!err)
			{
				if(result)
				{			
					response.send(result);
					response.end();
				}
				else
				{
					request.db.collection('main')
					.findOne({"id":parseInt(request.params.id), "dateTime":q_DT.toString()},
					function (err, result) 
					{
						if(!err)
						{
							if(result)
							{			
								response.send(result);
								response.end();
							}
							else
							{
								response.send("enter valid input");
								response.end();
							}
						}
						else
							{
								response.send("Error occured. Please try with valid input");
								response.end();
							}
					});	
				}
			}
			else
			{
				response.send("Error occured. Please try with valid input");
				response.end();
			}
		});
	}
});

//POST (Insert)
app.post('/insert', function(request, response)
{
	var l_id = parseInt(request.body.id);
	var l_value = request.body.value;

	request.db.collection('main')
	.findOne({"id":parseInt(request.body.id)},function (err, result) //select
	{
		if(!err)
		{
			if(result)
			{
				//insert new history record//update main table
				request.db.collection('history')
				.insert({"id":result.id
				,"value":result.value
				,"dateTime": result.dateTime}
				,{w:1}
				,function(err,data){
				request.db.collection('main')
				.update({"id":l_id}
				,{$set: {"value":l_value,"dateTime": Date.now().toString()}}
				,function(err, data){
				response.end();			
				}) 
				});// Insert);				
			}
			else
			{
				request.db.collection('main')
				.insert({"id":l_id
				,"value":l_value
				,"dateTime": Date.now().toString()}
				,function(err, data){
				response.end();
				}); 
			}				
		}
		else
		{
			response.send("Error occured. Please try with valid input");
			response.end();
		}
	});	
});


module.exports =app;