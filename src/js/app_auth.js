/*global Backbone,_,$,sjcl*/

// usage: call app_auth.auth(entity + '/tent') then call app_auth.finish()
var app_auth = (function () {
    'use strict';

    // from: http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
    var getURLParameter = function (name) {
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[null,""])[1].replace(/\+/g, '%20'))||null;
    };

    // prevents cross-site request forgery
    var validateState = function () {
        var urlState = getURLParameter('state'),
            savedState = localStorage.AppState;

        if (urlState !== savedState) {
            throw("CRSF warning");
        }
    };

    return {
        // does steps 0 thru 3
        auth: function (entity) {
            // TODO: clean this up
            this.discovery(entity, function () {
                this.getProfileData(null, function (data) {
                    this.register(null, function () {
                        this.authenticateApp();
                    }, this);
                }, this);
            }, this);
        },
        // does the final auth step
        finish: function () {
            // assumes 'code' and 'state' are in the URL params

            // ensure valid response
            validateState();

            var AppJSON = JSON.parse(localStorage.AppJSON);
            var matches = /^(http|https):\/\/([.\d\w\-]+)/.exec(localStorage.entity);
            var host = matches[2];

            // prepare request string for hmac signature
            var request = {
                method: 'POST',
                path: '/tent/apps/' + AppJSON.id + '/authorizations',
                host: host,
                port: 443
            };
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
                    'Authorization': 'MAC id="'+AppJSON.mac_key_id+'", ts="'+timestamp+'", nonce="'+nonce+'", mac="'+signature+'"'
                },
                data: JSON.stringify({
                    code: getURLParameter('code'),
                    token_type: 'mac'
                }),
                success: function (data, textStatus, jqXHR) {
                    // save authorization data
                    localStorage.AppJSON = JSON.stringify(data);
                }
            });
        },
        // step 0
        // note: entity must include API postfix (i.e. /tent for Tent.is)
        discovery: function (entity, callback, context) {
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

                    self.profileUrl = profileUrl;

                    callback.apply(context, [profileUrl]);
                }
            });
        },
        // step 1
        // gets profile data, providing it to the callback. (Also sets obj vars)
        getProfileData: function (profileUrl, callback, context) {
            var self = this;
            callback = callback || _.identity;
            context = context || this;
            profileUrl = profileUrl || this.profileUrl;

            $.getJSON(profileUrl, function (data, textStatus, jqXHR) {
                var coreData = data["https://tent.io/types/info/core/v0.1.0"];
                // tent servers for entity (may be different than entity url)
                self.servers = coreData["servers"];

                // might be different than the original entity
                localStorage.entity = coreData["entity"];

                callback.apply(context, [data]);
            });
        },
        // step 2
        // register app with server
        register: function (server, callback, context) {
            var self = this;
            callback = callback || _.identity;
            context = context || this;
            server = server || this.servers[0];
            var data = {
              "name": "hash-task",
              "description": "Collaborative issue tracking",
              "url": document.location.href,
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
                success: function (data, textStatus, jqXHR) {
                    localStorage.AppJSON = JSON.stringify(data);

                    callback.apply(context, [data]);
                }
            });
        },
        // step 3
        // authenticate the app
        authenticateApp: function () {
            var self = this;
            var server = this.servers[0];

            // used to prevent CRSF
            localStorage.AppState = Math.random().toString(36).substr(2,16);

            var queryString = {
                client_id: JSON.parse(localStorage.AppJSON).id,
                redirect_uri: document.location.href,
                scope: 'read_posts,write_posts',
                response_type: 'code',
                state: localStorage.AppState,
                tent_profile_info_types: 'https://tent.io/types/info/basic/v0.1.0',
                tent_post_types: 'https://tent.io/types/posts/status/v0.1.0'
            };

            // redirect user to authentication page
            document.location.href = server + '/oauth/authorize?' + $.param(queryString);
        }
    };
}());