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
        render: function (project, task) {
            project = project || null;
            task = task || null;

            // get posts for project
            var posts = this.collection.filter(function (post) {
                return project && post.get('project') === project;
            });

            if (task) {
                // get posts for task
                posts = _.filter(posts, function (post) {
                    return task && post.get('task') === task;
                });
            }

            // update DOM
            this.$el.html('<h4>Task Activity</h4>');
            _.each(posts, function (post) {
                var postView = new PostView({model: post});
                this.$el.append(postView.render());
            }, this);
        }
    });
});