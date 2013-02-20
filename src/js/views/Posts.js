/*global define*/

// a list of posts for a given task
define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'views/Post'
], function (Backbone, _, $, Mustache, PostView) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'tasks',
        task: null,
        render: function (task) {
            task = task ? task : this.task;
            this.task = task;

            // get posts for task
            var posts = this.collection.filter(function (post) {
                return post.get('task') === task;
            });

            // update DOM
            this.$el.html('');
            _.each(posts, function (post) {
                var postView = new PostView({model: post});
                this.$el.append(postView.render());
            }, this);

            return this.$el;
        }
    });
});