/**
* Test Harness
*
* @license     MIT
*
* @author      Steven Velozo <steven@velozo.com>
*/

//const libImporter = require('../test_support/bookstore-import-books.js'); libImporter(()=>{});
const libServer = require('../test_support/bookstore-serve-meadow-endpoint-apis.js'); libServer(()=>{{}});

/*
const libFable = require('fable');

const libOrator = require('orator');
const libOratorServiceServerRestify = require('orator-serviceserver-restify');

const libMeadow = require('meadow');
const libMeadowEndpoints = require('../source/Meadow-Endpoints.js');

const libSuperTest = require('supertest');
const libMySQL = require('mysql2');

////////// Code can go here for easy debugging //////////
const _HarnessBehavior = () =>
{
	let tmpRecords = [
		{GUIDAnimal:'0xHAXXXX', Name:'Jason', Type:'Triceratops'},
		{Name:'Rover',Type:'Car'},
		{GUIDAnimal:'0xDavison', Type:'Frog'}
	];

	return true;

	libSuperTest('http://localhost:8080/')
		.put('1.0/FableTest/Upserts')
		.send(tmpRecords)
		.end(
			function(pError, pResponse)
			{
				// Expect response to be the record we just created.
				var tmpResult = JSON.parse(pResponse.text);
				console.log(JSON.stringify(tmpResult,null,4));
			}
		);
};

// Construct a fable.
const _Fable = new libFable(require(`./Harness-Configuration.json`));

// Connect to SQL, put the connection in the magic location
_Fable.MeadowMySQLConnectionPool = libMySQL.createPool
(
	{
		connectionLimit: _Fable.settings.MySQL.ConnectionPoolLimit,
		host: _Fable.settings.MySQL.Server,
		port: _Fable.settings.MySQL.Port,
		user: _Fable.settings.MySQL.User,
		password: _Fable.settings.MySQL.Password,
		database: _Fable.settings.MySQL.Database,
		namedPlaceholders: true
	}
);

// Load up a Meadow (pointing at the Animal database)
const _AnimalSchema = require('./Animal.json');
const _Meadow = libMeadow.new(_Fable, 'FableTest')
	.setProvider('MySQL')
	.setSchema(_AnimalSchema.Schema)
	.setJsonSchema(_AnimalSchema.JsonSchema)
	.setDefaultIdentifier(_AnimalSchema.DefaultIdentifier)
	.setDefault(_AnimalSchema.DefaultObject);

// Instantiate the meadow endpoints with the DAL object constructed above
const _MeadowEndpoints = new libMeadowEndpoints(_Meadow);

// Instantiate the service server, using restify
const _Orator = new libOrator(_Fable, libOratorServiceServerRestify);
// Prepare the service server for mapping endpoints
_Orator.initializeServiceServer();

_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Schema-PreOperation', 
	function (pRequest, pRequestState, fCallback)
	{
		this.log.info('I have access to state!', pRequestState);
		return fCallback();
	});

_MeadowEndpoints.controller.BehaviorInjection.setBehavior('Schema-PostOperation', 
	function (pRequest, pRequestState, fCallback)
	{
		pRequestState.JSONSchema.PLOT = `GODZILLA WILL EAT YOUR SOUL!`;
		this.log.info('I can also mutate state before sending!', pRequestState);
		return fCallback();
	});

// Wire the endpoints up
_MeadowEndpoints.connectRoutes(_Orator.serviceServer);

// Now start the web server.
_Orator.startWebServer(_HarnessBehavior);
*/
