/**
* Meadow Endpoint - Read a select list of Records (for Drop-downs and such)
*
* @license MIT
*
* @author Steven Velozo <steven@velozo.com>
* @module Meadow
*/
var libAsync = require('async');
/**
* Get a set of records from a DAL.
*/
var doAPIReadSelectListEndpoint = function(pRequest, pResponse, fNext)
{
	var tmpNext = (typeof(fNext) === 'function') ? fNext : function() {};

	// This state is the requirement for the UserRoleIndex value in the SessionData object... processed by default as >=
	// The default here is that any authenticated user can use this endpoint.
	pRequest.EndpointAuthorizationRequirement = pRequest.EndpointAuthorizationLevels.Reads;
	
	// INJECT: Pre authorization (for instance to change the authorization level)
	
	// OVERLOAD: Endpoint authorization (for instance if it is a complex authorization requirement)
	if (pRequest.CommonServices.authorizeEndpoint(pRequest, pResponse, fNext) === false)
	{
		// If this endpoint fails, it's sent an error automatically.
		return;
	}

	// INJECT: Pre endpoint operation

	libAsync.waterfall(
		[
			// 1. Get the records
			function (fStageComplete)
			{
				// OVERLOAD: Query instantiation
				var tmpQuery = pRequest.DAL.query;

				// TODO: Limit the query to the columns we need for the templated expression

				// INJECT: Query configuration and population

				// OVERLOAD: Query paging data
				var tmpCap = false;
				var tmpBegin = false;
				if (typeof(pRequest.params.Begin) === 'string')
				{
					tmpBegin = parseInt(pRequest.params.Begin);
				}
				if (typeof(pRequest.params.Cap) === 'string')
				{
					tmpCap = parseInt(pRequest.params.Cap);
				}
				tmpQuery.setCap(tmpCap).setBegin(tmpBegin);

				// TODO: Set an upper limit for what can be returned in the select list

				// Do the record read
				pRequest.DAL.doReads(tmpQuery, fStageComplete);
			},
			// 2. Post processing of the records
			function (pQuery, pRecords, fStageComplete)
			{
				// INJECT: Results validation, pass in pRecords

				if (pRecords.length < 1)
				{
					pRequest.CommonServices.log.info('Successfully delivered empty recordset', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Reads'});
					return pResponse.send([]);
				}

				// INJECT: Post process the records, tacking on or altering anything we want to do.

				// Complete the waterfall operation
				fStageComplete(false, pQuery, pRecords);
			},
			// 3. Marshalling of records into the hash list, using underscore templates.
			function (pQuery, pRecords, fStageComplete)
			{
				// Look on the Endpoint Customization object for an underscore template to generate hashes.

			}
		],
		// 3. Return the results to the user
		function(pError, pQuery, pRecords)
		{
			if (pError)
			{
				return pRequest.CommonServices.sendError('Error retreiving a recordset.', pRequest, pResponse, fNext);
			}

			pRequest.CommonServices.log.info('Read a recordset with '+pRecords.length+' results.', {SessionID:pRequest.SessionData.SessionID, RequestID:pRequest.RequestUUID, RequestURL:pRequest.url, Action:pRequest.DAL.scope+'-Reads'});
			pResponse.send(pRecords);
			return tmpNext();
		}
	);
};

module.exports = doAPIReadSelectListEndpoint;