/*global define*/

// usage: call app_auth.auth(entity + '/tent') then call app_auth.finish()
define([
    'backbone',
    'underscore',
    'jquery',
    'sjcl',
    'utils/url'
], function (Backbone,_,$,sjcl,urlUtils) {
    'use strict';

    var authModel = null;

    // prevents cross-site request forgery
    var validateState = function () {
        var urlState = urlUtils.getURLParameter('state'),
            savedState = authModel.get('AppState');

        if (urlState !== savedState) {
            throw("CRSF warning");
        }
    };

    /*
        Sends an HTTPS request to the authorized Tent server
        Expects request to have 1) method and 2) relative path
    */
    var auth_ajax = function (request, data, callback, access_token) {
        var AppJSON = authModel.get('AppJSON');
        var hostPattern = /^(http|https):\/\/([.\d\w\-]+)/.exec(authModel.get('entity'));
        var host = hostPattern[2];

        // prepare request string for hmac signature
        request.host = host;
        request.port = 443;

        access_token = access_token || AppJSON.access_token;

        var date = new Date(),
            timestamp = parseInt((date * 1) / 1000, 10),
            nonce = Math.random().toString(16).substring(3),
            request_string = [timestamp, nonce, request.method.toUpperCase(), request.path, request.host, request.port, null, null].join("\n");

        // create base64-encoded hash token for authentication
        // TODO: support other encryptions. (currently assuming sha-256-hmac)
        var hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(AppJSON.mac_key));
        var signature = sjcl.codec.base64.fromBits(hmac.mac(request_string));

        $.ajax({
            url: 'https://' + request.host + request.path,
            type: request.method,
            contentType: 'application/vnd.tent.v0+json',
            headers: {
                'Accept': 'application/vnd.tent.v0+json',
                'Authorization': 'MAC id="'+access_token+'", ts="'+timestamp+'", nonce="'+nonce+'", mac="'+signature+'"'
            },
            data: JSON.stringify(data),
            success: function (data, textStatus, jqXHR) {
                callback(data, textStatus, jqXHR);
            }
        });
    };

    // step 0
    // note: entity must include API postfix (i.e. /tent for Tent.is)
    var discovery = function (entity, callback, context) {
        var self = this;
        callback = callback || _.identity;
        context = context || this;

        $.ajax({
            url: entity, 
            type: 'HEAD',
            headers: {
                'Accept': 'application/vnd.tent.v0+json'
            },
            success: function (data, textStatus, jqXHR) {
                // note: getResponseHeader not currently working in FF
                var linkHeader = jqXHR.getResponseHeader('Link');
                var profileUrl = /<(.*)>/.exec(linkHeader)[1];

                // ensure profile url is complete
                if (profileUrl.indexOf('http') !== 0) {
                    var matches = /^(http|https):\/\/([.\d\w\-]+)\//.exec(entity);
                    var protocol = matches[1];
                    var host = matches[2];
                    profileUrl = protocol + '://' + host + profileUrl;
                }

                authModel.set('profileUrl', profileUrl);

                callback.apply(context, [profileUrl]);
            }
        });
    };
    // step 1
    // gets profile data, providing it to the callback. (Also sets obj vars)
    var getProfileData = function (profileUrl, callback, context) {
        var self = this;
        callback = callback || _.identity;
        context = context || this;
        profileUrl = profileUrl || authModel.get('profileUrl');

        $.getJSON(profileUrl, function (data, textStatus, jqXHR) {
            var coreData = data["https://tent.io/types/info/core/v0.1.0"];
            // tent servers for entity (may be different than entity url)
            authModel.set('servers', coreData["servers"]);

            // might be different than the original entity
            authModel.set('entity', coreData["entity"]);

            callback.apply(context, [data]);
        });
    };
    // step 2
    // register app with server
    var register = function (server, callback, context) {
        var self = this;
        callback = callback || _.identity;
        context = context || this;
        server = server || authModel.get('servers')[0];
        var data = {
          "name": "hash-task",
          "description": "Collaborative issue tracking",
          "url": document.location.origin + document.location.pathname,
          "redirect_uris": [
            document.location.href
          ],
          "scopes": {
            "read_posts": "Reads posts",
            "write_posts": "Writes posts"
          }
        };

        // note: just using the first server for now. TODO: test servers for availability first
        $.ajax({
            url: server + '/apps', 
            type: 'POST',
            contentType: 'application/vnd.tent.v0+json',
            headers: {
                'Accept': 'application/vnd.tent.v0+json'
            },
            data: JSON.stringify(data),
            success: function (rdata, textStatus, jqXHR) {
                authModel.set('AppJSON', rdata);

                callback.apply(context, [rdata]);
            }
        });
    };
    // step 3
    // authenticate the app
    var authenticateApp = function () {
        var self = this;
        var server = authModel.get('servers')[0];

        // used to prevent CRSF
        authModel.set('AppState', Math.random().toString(36).substr(2,16));

        var queryString = {
            client_id: authModel.get('AppJSON').id,
            redirect_uri: document.location.href,
            scope: 'read_posts,write_posts',
            response_type: 'code',
            state: authModel.get('AppState'),
            tent_profile_info_types: 'https://tent.io/types/info/basic/v0.1.0',
            tent_post_types: 'https://tent.io/types/posts/status/v0.1.0'
        };

        // redirect user to authentication page
        document.location.href = server + '/oauth/authorize?' + $.param(queryString);
    };

    var functions = {
        // does steps 0 thru 3
        auth: function (entity) {
            // TODO: clean this up
            discovery(entity, function () {
                getProfileData(null, function (data) {
                    register(null, function () {
                        authenticateApp();
                    }, this);
                }, this);
            }, this);
        },
        // does the final auth step
        finish: function (cb) {
            // assumes 'code' and 'state' are in the URL params

            // ensure valid response
            validateState();

            var AppJSON = authModel.get('AppJSON'),
                access_token = AppJSON.mac_key_id;

            // prepare request string for hmac signature
            var request = {
                method: 'POST',
                path: '/tent/apps/' + AppJSON.id + '/authorizations'
            };
            var data = {
                code: urlUtils.getURLParameter('code'),
                token_type: 'mac'
            };
            auth_ajax(request, data, function (rdata, textStatus, jqXHR) {
                // save authorization data
                authModel.set('AppJSON', rdata);
                authModel.set('isLoggedIn', true);
                cb();
            }, access_token);
        },
        auth_ajax: auth_ajax
    };

    // authModel stores auth data
    return function (authModel_in) {
        authModel = authModel_in;
        return functions;
    };
});