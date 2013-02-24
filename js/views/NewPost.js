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
            'submit .newPostForm': 'newPost',
            'change .project': 'updateTaskDisabledness',
            'change input': 'updateModel',
            'change textarea': 'updateModel',
            'change select': 'updateModel'
        },
        initialize: function (options) {
            this.allPosts = options.allPosts;
            this.authModel = options.authModel;
            this.model = new PostModel();
            // this.model.bind('change', this.render, this);
        },
        render: function () {
            var self = this;

            // hide or show depending on logged in status      
            if (this.authModel.get('isLoggedIn') && !this.$el.is(':visible')) {
                this.model.set('visibility', '');
            }
            else if(!this.authModel.get('isLoggedIn') && this.$el.is(':visible')) {
                this.model.set('visibility', 'hidden');
            }

            // do render
            var rendered = Mustache.render(NewPostTemplate, this.model.toJSON());
            this.$el.html(rendered);

            this.updateTaskDisabledness();

            // prepare field typeaheads
            this.$('.project').typeahead({source: _.bind(this.getProjects, this)});
            this.$('.task').typeahead({source: _.bind(this.getProjectTasks, this)});
            this.$('.assignee').typeahead({source: _.bind(this.getFollowees, this)});

            // ensure select field is set
            this.$('.status').val(this.model.get('status'));
        },
        newPost: function (evt) {
            var self = this,
                date = new Date(),
                timestamp = parseInt((date * 1) / 1000, 10),
                AppJSON = JSON.parse(localStorage.AppJSON),
                task = this.model.get('task'),
                project = this.model.get('project'),
                status = this.model.get('status'),
                comment = this.model.get('comment'),
                assignee = this.model.get('assignee');

            // prepare request string for hmac signature
            var request = {
                method: 'POST',
                path: '/tent/posts'
            };

            // build content text string
            var projectText = _.size(project) ? '#' + project : '';
            var taskText = _.size(task) ? '/' + task : '';
            var statusText = _.size(status) ? '#' + status.toLowerCase() : '';
            var assignText = _.size(assignee) ? '#assign ^' + assignee : '';
            var text = comment + ' ' +
                       projectText + 
                       taskText + ' ' +
                       statusText + ' ' +
                       assignText;

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
                self.render();
                self.trigger('posted');
            });
        },
        updateTaskDisabledness: function () {
            var projectName = this.$('.project').val(),
                isDisabled = this.$('.task').attr('disabled') === 'disabled';

            if (_.size(projectName) > 0 && isDisabled) {
                this.$('.task').removeAttr('disabled');
            }
            else if (_.size(projectName) === 0 && !isDisabled) {
                this.model.set('task', '');
                this.$('.task').attr('disabled', 'disabled');
            }
        },
        updateModel: function (evt) {
            var $field = $(evt.target),
                val = $field.val(),
                name = $field.attr('name'),
                className = $field.attr('class');

            this.model.set(name, val);
        },
        getProjects: function () {
            return _.without(_.keys(this.allPosts.groupBy('project')), 'null');
        },
        getProjectTasks: function () {
            // TODO: implement some sort of caching, since this is called on each tasks field keypress
            //       (maybe break this View up into multiple views that share models?)
            var projectName = this.model.get('project');
            var postsForProject = this.allPosts.filter(function (post) {
                return post.get('project') === projectName;
            });
            var tasks = _.keys(_.groupBy(postsForProject, function (post) {
                return post.get('task');
            }));
            return _.without(tasks, 'null');
        },
        getFollowees: function () {
            return _.keys(this.allPosts.groupBy('user'));
        }
    });
});