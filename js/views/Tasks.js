/*global define*/

// a list of tasks for a given project
define(['backbone', 'underscore', 'jquery', 'libs/mustache'], function (Backbone, _, $, Mustache) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'project',
        events: {
            'click .btn': 'showTask'
        },
        render: function (project) {
            project = project ? project : null;

            // get posts for project
            var posts = this.collection.filter(function (post) {
                return post.get('project') === project;
            });

            // get tasks for project
            var tasks = _.without(_.keys(_.groupBy(posts, function (post) {
                return post.get('task'); })), 'null');

            // update DOM
            this.$el.html('');
            var template = '<a href="{{ location }}" class="btn btn-success">{{ task }}</a> ';
            var locParts = document.location.hash.split('/');
            _.each(tasks, function (task) {
                locParts[1] = task;
                var data = {location: locParts.join('/'), task: task};
                this.$el.append(Mustache.render(template, data));
            }, this);

            return this.$el;
        },
        showTask: function (evt) {
            var task = evt.currentTarget.hash;
            this.trigger('taskClicked', task);
        }
    });
});