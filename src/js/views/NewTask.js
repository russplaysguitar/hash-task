/*global define*/

define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'sjcl', 'text!templates/new_task.html'
], function (Backbone, _, $, Mustache, sjcl, NewTaskTemplate) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: '',
        events: {
            'click .btn': 'newPost'
        },
        render: function () {
            if (this.model.get('isLoggedIn')) {
                // update DOM
                this.$el.html(NewTaskTemplate);
            }
            else {
                this.$el.html('');
            }
            return this.$el;
        },
        newPost: function (evt) {
            var AppJSON = JSON.parse(localStorage.AppJSON);
            var matches = /^(http|https):\/\/([.\d\w\-]+)/.exec(localStorage.entity);
            var host = matches[2];

            // prepare request string for hmac signature
            var request = {
                method: 'POST',
                path: '/tent/posts',
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

            var data = {
                "type": "https://tent.io/types/post/status/v0.1.0",
                "published_at": timestamp,
                "permissions": {
                    "public": true
                },
                "licenses": [
                    "http://creativecommons.org/licenses/by/3.0/"
                ],
                "content": {
                    "text": this.$('.comment').val()
                }
            };

            var self = this;
            $.ajax({
                url: 'https://' + request.host + request.path,
                type: request.method,
                contentType: 'application/vnd.tent.v0+json',
                headers: {
                    'Accept': 'application/vnd.tent.v0+json',
                    'Authorization': 'MAC id="'+AppJSON.access_token+'", ts="'+timestamp+'", nonce="'+nonce+'", mac="'+signature+'"'
                },
                data: JSON.stringify(data),
                success: function () {
                    self.$('.comment').val('');
                    Backbone.history.loadUrl(Backbone.history.fragment);// refresh page 
                }
            });
        }
    });
});