/*global define*/

define([
    'backbone', 
    'underscore', 
    'jquery', 
    'libs/mustache', 
    'app_auth', 
    'libs/bootstrap', 
    'text!templates/new_post.html',
    'models/Post'
], function (Backbone, _, $, Mustache, app_auth, bootstrap, NewPostTemplate, PostModel) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: '',
        events: {
            'click .btn': 'newPost',
            'change .project': 'updateTaskNameField'
        },
        initialize: function (options) {
            this.allPosts = options.allPosts;
            this.authModel = options.authModel;
            this.model = new PostModel();
        },
        render: function () {
            var self = this;
            if (this.authModel.get('isLoggedIn')) {
                // update DOM
                var rendered = Mustache.render(NewPostTemplate, this.model.toJSON());
                this.$el.html(rendered);
                
                // update
                this.updateTaskNameField();

                // set up typeahead
                var projects = _.keys(this.allPosts.groupBy('project'));
                this.$('.project').typeahead({source: projects});
                this.$('.task').typeahead({source: _.bind(this.getProjectTasks, this)});
                
                // setup model/field bindings
                this.$('.comment').change(function () {
                    self.model.set('content', {text: $(this).val()});
                });
                this.$('.project').change(function () {
                    self.model.set('project', $(this).val());
                });
                this.$('.task').change(function () {
                    self.model.set('task', $(this).val());
                });

                this.$el.show();
            }
            else {
                this.$el.hide();
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

            var text = Mustache.render('{{ content.text }} #{{ project }}/{{ task }}', this.model.toJSON());
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
                    "text": text
                }
            };

            // make new post request
            app_auth(this.authModel).auth_ajax(request, data, function () {
                // on success...
                self.model.clear();
                self.trigger('posted');
            });
        },
        updateTaskNameField: function (evt) {
            var projectName = this.$('.project').val();

            if (projectName.length > 0) {
                this.$('.task').removeAttr('disabled');
            }
            else {
                this.$('.task').val('');
                this.$('.task').attr('disabled', 'disabled');
            }
        },
        getProjectTasks: function () {
            // TODO: implement some sort of caching, since this is called on each tasks field keypress
            //       (maybe break this View up into multiple views that share models?)
            var projectName = this.$('.project').val();
            var postsForProject = this.allPosts.filter(function (post) {
                return post.get('project') === projectName;
            });
            var tasks = _.keys(_.groupBy(postsForProject, function (post) {
                return post.get('task');
            }));
            return tasks;
        }
    });
});