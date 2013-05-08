/*global define*/

// a list of posts for a given project or task
define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'views/Post'
], function (Backbone, _, $, Mustache, PostView) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'tasks',
        initialize: function (options) {
            options.collection.on('change', function () { 
                this.render();
            }, this);
        },
        render: function (project, task, status) {
            project = project || null;
            task = task || null;
            status = status || null;

            // get posts for project
            var posts = this.collection.filter(function (post) {
                return project && post.get('project') === project;
            });

            if (task) {
                // get posts for task
                posts = _.filter(posts, function (post) {
                    return post.get('task') === task;
                });
                this.$el.html('<h4>Issue Activity</h4>');
            }
            else {
                this.$el.html('<h4>Project Activity</h4>');
            }

            // update DOM
            _.each(posts, function (post) {
                var postView = new PostView({model: post});
                this.$el.append(postView.render());
            }, this);

            // hide or show the element
            if (_.size(posts) && this.$el.is(':hidden')) {
                this.$el.show();
            }
            else if (!_.size(posts) && this.$el.is(':visible')){
                this.$el.hide();
            }
        }
    });
});