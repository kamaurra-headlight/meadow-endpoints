/**
* Meadow Endpoint - Read a list of lite Records (for Drop-downs and such)
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
var libAsync = require('async');
var meadowFilterParser = require('./Meadow-Filter-Parse.js');
/**
* Get a set of records from a DAL.
*/
var doAPIReadLiteEndpoint = function(pRequest, pResponse, fNext)
{
	// This state is the requirement for the UserRoleIndex value in the UserSession object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Reads;
	
	// INJECT: Pre authorization (for instance to change the authorization level)

	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	libAsync.waterfall(
		[
			// 1a. Get the records
			function (fStageComplete)
			{
				pRequest.Query = pRequest.DAL.query;
				// TODO: Limit the query to the columns we need for the templated expression

				var tmpCap = false;
				var tmpBegin = false;
				if (typeof(pRequest.params.Begin) === 'string' ||
					typeof(pRequest.params.Begin) === 'number')
				{
					tmpBegin = parseInt(pRequest.params.Begin);
				}
				if (typeof(pRequest.params.Cap) === 'string' ||
					typeof(pRequest.params.Cap) === 'number')
				{
					tmpCap = parseInt(pRequest.params.Cap);
				}
				else
				{
					//maximum number of records to return by default on Read queries. Override via "MeadowDefaultMaxCap" fable setting.
					tmpCap = pRequest.DEFAULT_MAX_CAP;
				}
				pRequest.Query.setCap(tmpCap).setBegin(tmpBegin);
				if (typeof(pRequest.params.Filter) === 'string')
				{
					// If a filter has been passed in, parse it and add the values to the query.
					meadowFilterParser(pRequest.params.Filter, pRequest.Query);
				}

				fStageComplete(false);
			},
			// 1b. INJECT: Query configuration
			function (fStageComplete)
			{
				pRequest.BehaviorModifications.runBehavior('Reads-QueryConfiguration', pRequest, fStageComplete);
			},
			// 1c. Do the record read
			function (fStageComplete)
			{
				pRequest.DAL.doReads(pRequest.Query, fStageComplete);
			},
			// 2. Post processing of the records
			function (pQuery, pRecords, fStageComplete)
			{
				if (pRecords.length < 1)
				{
					pRecords = [];
				}

				pRequest.Records = pRecords;

				// Complete the waterfall operation
				fStageComplete(false);
			},
			// 2.5: Check if there is an authorizer set for this endpoint and user role combination, and authorize based on that
			function (fStageComplete)
			{
				pRequest.Authorizers.authorizeRequest('ReadLite', pRequest, fStageComplete);
			},
			// 2.6: Check if authorization or post processing denied security access to the record
			function (fStageComplete)
			{
				if (pRequest.MeadowAuthorization)
				{
					return fStageComplete(false);
				}

				// It looks like this record was not authorized.  Send an error.
				return fStageComplete({Code:405,Message:'UNAUTHORIZED ACCESS IS NOT ALLOWED'});
			},
			// 3. Marshalling of records into the hash list, using underscore templates.
			function (fStageComplete)
			{
				// Look on the Endpoint Customization object for an underscore template to generate hashes.
				var tmpLiteList = [];
				var tmpFieldList = [];

				// Peek at the first record to check for updatedate				
				var tmpHasUpdateDate = (pRequest.Records.length > 0 && pRequest.Records[0].hasOwnProperty('UpdateDate')) ? true : false;
				var tmpGUID = (pRequest.DAL.defaultGUIdentifier && pRequest.DAL.defaultGUIdentifier.length > 0) ? pRequest.DAL.defaultGUIdentifier : false;
				//Include all GUID and ID fields on the record
				if (pRequest.Records.length > 0)
				{
					let tmpRecordFields = Object.keys(pRequest.Records[0]);
					tmpRecordFields.forEach(function(field)
					{
						if (field.indexOf('ID') === 0 ||
							field.indexOf('GUID') === 0)
						{
							tmpFieldList.push(field);
						}
					});
				}

				for (var i = 0; i < pRequest.Records.length; i++)
				{
					let tmpLiteRecord = (
						{
							Value: pRequest.BehaviorModifications.processTemplate('SelectList', {Record:pRequest.Records[i]}, pRequest.DAL.scope+' #<%= Record.'+pRequest.DAL.defaultIdentifier+'%>')
						});
					tmpLiteRecord[pRequest.DAL.defaultIdentifier] = pRequest.Records[i][pRequest.DAL.defaultIdentifier];

					if (tmpGUID)
						tmpLiteRecord[tmpGUID] = pRequest.Records[i][tmpGUID];
					if (tmpHasUpdateDate)
						tmpLiteRecord['UpdateDate'] = pRequest.Records[i].UpdateDate;

					tmpFieldList.forEach(function(field)
					{
						tmpLiteRecord[field] = pRequest.Records[i][field];
					});

					tmpLiteList.push(tmpLiteRecord);
				}

				fStageComplete(false, tmpLiteList);
			}
		],
		// 3. Return the results to the user
		function(pError, pResultRecords)
		{
			// Remove 'Records' object from pRequest, instead return template results (pResultRecords) for the records
			delete pRequest['Records'];

			if (pError)
			{
				return pRequest.CommonServices.sendCodedError('Error retreiving a recordset.', pError, pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a recordset lite list with '+pResultRecords.length+' results.', {SessionID:pRequest.UserSession.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-ReadLite'}, pRequest);
			pResponse.send(pResultRecords);
			return fNext();
		}
	);
};

module.exports = doAPIReadLiteEndpoint;