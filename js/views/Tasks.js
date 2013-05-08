/*global define*/

// a list of tasks for a given project
define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'utils/url', 'text!templates/tasks.html'
], function (Backbone, _, $, Mustache, urlUtils, TasksTemplate) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'project',
        events: {
            'click .btn': 'showTask'
        },
        initialize: function (options) {
            options.collection.on('change', function () { 
                this.render();
            }, this);
        },
        render: function (project, status) {
            project = project ? project : null;

            // get posts for project
            var posts = this.collection.filter(function (post) {
                return post.get('project') === project;
            });

            // group posts by task (includes null)
            var taskGroups = _.groupBy(posts, function(post) {
                return post.get('task');
            });
            
            // get tasks for project
            var tasks = _.without(_.keys(taskGroups), 'null');

            if (status) {
                // filter for tasks that match the status...

                // build a map of task statuses
                var taskStatuses = {};
                _.each(taskGroups, function(posts, taskName) {
                    var statusChangePosts = _.filter(posts, function(post) {
                        var status = post.get('status');
                        return status === 'open' || status === 'close';
                    });
                    var sorted = _.sortBy(statusChangePosts, function (post) {
                        return post.get('published_at');
                    });
                    if (!sorted.length) { return; }// no posts
                    var status = _.last(sorted).get('status');
                    status = status === 'close' ? 'closed' : status;// fix status tense
                    taskStatuses[taskName] = status;
                });
                
                // now, filter tasks that match the status
                tasks = _.filter(tasks, function (task) {
                    return taskStatuses[task] === status;
                });
            }

            // update DOM
            var locParts = document.location.hash.split('/');
            var tasksData = [];
            var currentTask = urlUtils.getTask();
            _.each(tasks, function (task) {
                locParts[1] = task;
                var active = task === currentTask ? 'active' : '';
                var data = {location: locParts.join('/'), task: task, active: active};
                tasksData.push(data);
            }, this);
            this.$el.html(Mustache.render(TasksTemplate, {tasks: tasksData}));

            // hide or show the element
            if (_.size(tasks) && this.$el.is(':hidden')) {
                this.$el.show();
            }
            else if (!_.size(tasks) && this.$el.is(':visible')){
                this.$el.hide();
            }
        },
        showTask: function (evt) {
            var task = evt.currentTarget.hash;
            this.trigger('taskClicked', task);
        }
    });
});