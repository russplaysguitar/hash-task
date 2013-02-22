/*global define*/

define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'app_auth', 'text!templates/new_task.html'
], function (Backbone, _, $, Mustache, app_auth, NewTaskTemplate) {
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
            var self = this,
                date = new Date(),
                timestamp = parseInt((date * 1) / 1000, 10),
                AppJSON = JSON.parse(localStorage.AppJSON);

            // prepare request string for hmac signature
            var request = {
                method: 'POST',
                path: '/tent/posts'
            };
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
            app_auth(this.model).auth_ajax(request, data, function () {
                self.$('.comment').val('');
                Backbone.history.loadUrl(Backbone.history.fragment);// refresh page 
            });
        }
    });
});