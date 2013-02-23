/*global define*/

// a list of tasks for a given project
define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'text!templates/tasks.html'
], function (Backbone, _, $, Mustache, TasksTemplate) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'project',
        events: {
            'click .btn': 'showTask'
        },
        initialize: function (options) {
            // options.collection.on('change', function () { 
            //     this.render();
            // }, this);
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
            var locParts = document.location.hash.split('/');
            var tasksData = [];
            _.each(tasks, function (task) {
                locParts[1] = task;
                var data = {location: locParts.join('/'), task: task};
                tasksData.push(data);
            }, this);
            this.$el.html(Mustache.render(TasksTemplate, {tasks: tasksData}));

            return this.$el;
        },
        showTask: function (evt) {
            var task = evt.currentTarget.hash;
            this.trigger('taskClicked', task);
        }
    });
});