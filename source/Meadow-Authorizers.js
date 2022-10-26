/**
* The Meadow Security Authorizor Collection
*
* Provide a set of security authorizers, and give the API consumer the ability to add to or modify them.
*
* @class MeadowAuthorizers
* @constructor
*/
var libUnderscore = require('underscore');
var libAsync = require('async');

var MeadowAuthorizers = function()
{
	function createNew(pMeadow)
	{
		// If a valid fable object isn't passed in, return a constructor
		if ((typeof(pMeadow) !== 'object') || !('fable' in pMeadow))
		{
			return {new: createNew};
		}

		const _AuthorizationMode = pMeadow.fable.settings.MeadowAuthorizationMode || 'Disabled';

		// An object to hold modifications to specific authorizers.
		var _AuthorizerFunctions = {};


		/**
		* Set a specific authorizer.
		*
		* The anatomy of a authorizer function is as follows:
		*
		* var someAuthorizer = function(pRequest, fComplete)
		* {
		*      // Do some stuff with pRequest...
		*      if (pRequest.UserSession.UserRoleIndex < 5)
		*          pRequest.MeadowAuthorization = pRequest.MeadowAuthorization && false;
		*
		*      return fComplete(false);
		* }
		*
		* It is important to note that the fComplete function expects false if no error, or a string message if there is one.
		*/
		var setAuthorizer = function(pAuthorizerHash, fAuthorizer)
		{
			_AuthorizerFunctions[pAuthorizerHash] = fAuthorizer;
		};

		/**
		* Get a specific authorizer.
		*/
		var getAuthorizer = function(pAuthorizerHash)
		{
			return _AuthorizerFunctions[pAuthorizerHash];
		};

		if (_AuthorizationMode === 'SimpleOwnership')
		{
			// Map in the authorizers for simple ownership mode
			setAuthorizer('Allow', require(__dirname+'/authorizers/Meadow-Authorizer-Allow.js'));
			setAuthorizer('Deny', require(__dirname+'/authorizers/Meadow-Authorizer-Deny.js'));
			setAuthorizer('Mine', require(__dirname+'/authorizers/Meadow-Authorizer-Mine.js'));
			setAuthorizer('MyCustomer', require(__dirname+'/authorizers/Meadow-Authorizer-MyCustomer.js'));
		}

		/**
		* This method runs a authorizer at a specific hash, and returns true.
		* Or it returns false if there was no authorizer there.
		* Authorizers should expect their state to be in the pRequest object, per the example in setAuthorizer
		*/
		var authorize = function(pAuthorizerHash, pRequest, fComplete)
		{
			// Add the authorization value to the request object if it doesn't exist yet
			if (!pRequest.hasOwnProperty('MeadowAuthorization'))
			{
				pRequest.MeadowAuthorization = true;
			}

			// authorize all behaviors if authorization is disabled
			if (_AuthorizationMode === 'Disabled')
			{
				return fComplete();
			}

			//FIXME: Get rid of this...
			if (pRequest.Satchel &&
				pRequest.Satchel.AuthorizeOverride)
				return fComplete(false);

			// Run an injected authorizer (if it exists)
			if (_AuthorizerFunctions.hasOwnProperty(pAuthorizerHash))
			{
				if (!pRequest.Record &&
					pRequest.Records)
				{
					// Run the authorizer for multiple records

					libAsync.eachSeries(pRequest.Records, function(pRecord, fNext)
					{
						pRequest.Record = pRecord;

						_AuthorizerFunctions[pAuthorizerHash](pRequest, function(err)
						{
							if (err)
								return fNext({Error: err});

							// If MeadowAuthorization fails, keep the state and pass it on
							return fNext(!pRequest.MeadowAuthorization);
						});
					},
					function(pCancelled)
					{
						delete pRequest['Record']; //remove this property as it should only contains 'Records'

						if (pCancelled &&
							pCancelled.Error)
						{
							return fComplete(pCancelled.Error);
						}

						return fComplete(false);
					});
				}
				else
				{
					// Run the authorizer for one record
					return _AuthorizerFunctions[pAuthorizerHash](pRequest, fComplete);
				}
			}
			else
			{
				return fComplete(false);
			}
		};


		// Try to execute any defined authorizers on the proper endpoint
		var authorizeRequest = function(pRequestHash, pRequest, fComplete)
		{
			// Add the authorization value to the request object if it doesn't exist yet
			if (!pRequest.hasOwnProperty('MeadowAuthorization'))
			{
				pRequest.MeadowAuthorization = true;
			}

			// authorize all behaviors if authorization is disabled
			if (_AuthorizationMode === 'Disabled')
			{
				return fComplete();
			}

			// Attach authorizer hash in case the invoked authorizer needs the endpoint context
			pRequest.EndpointHash = pRequestHash;

			// See if there is an authorizer collection for the role of the user
			var tmpRoleAuthorizer = pRequest.DAL.schemaFull.authorizer[pRequest.DAL.getRoleName(pRequest.UserSession.UserRoleIndex)];
			if (!tmpRoleAuthorizer)
			{
				// Fallback to default definition, if present
				tmpRoleAuthorizer = pRequest.DAL.schemaFull.authorizer['__DefaultAPISecurity'];
			}

			// Authorizing Endpoint
			//console.log(pRequestHash + ' >>> '+pRequest.DAL.getRoleName(pRequest.UserSession.UserRoleIndex)+'   -   '+pRequest.UserSession.UserRoleIndex+' Authorization Configuration: '+JSON.stringify(tmpRoleAuthorizer));


			if ((typeof(tmpRoleAuthorizer) === 'object') && tmpRoleAuthorizer.hasOwnProperty(pRequestHash))
			{
				// Authorizing Endpoint
				//console.log(' >>> Authorizing Endpoint: '+JSON.stringify(tmpRoleAuthorizer));
				// If there is an authorizer collection in the DAL and it has this request hash as a property in it, execute the authorizer(s)
				if (typeof(tmpRoleAuthorizer[pRequestHash]) === 'string')
				{
					// Execute the single authorizer
					authorize(tmpRoleAuthorizer[pRequestHash], pRequest, fComplete);
				}
				else
				{
					// Execute every authorizer in the array
					libAsync.eachSeries(tmpRoleAuthorizer[pRequestHash],
						function(pAuthorizerHash, fCallback)
						{
							authorize(pAuthorizerHash, pRequest, fCallback);
						},
						fComplete);
				}
			}
			else
			{
				fComplete();
			}
		}


		/**
		* Container Object for our Factory Pattern
		*/
		var tmpNewMeadowAuthorizer = (
		{
			setAuthorizer: setAuthorizer,
			getAuthorizer: getAuthorizer,
			authorize: authorize,
			authorizeRequest: authorizeRequest,

			new: createNew
		});

		return tmpNewMeadowAuthorizer;
	}

	return createNew();
};

module.exports = new MeadowAuthorizers();
