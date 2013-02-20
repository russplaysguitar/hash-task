/*global define*/

// a list of tasks for a given project
define(['backbone', 'underscore', 'jquery', 'libs/Mustache'], function (Backbone, _, $, Mustache) {
    return Backbone.View.extend({
        tagName: 'div',
        className: 'project',
        events: {
            'click .btn': 'showTask'
        },
        project: null,
        render: function (project) {
            project = project ? project : this.project;
            this.project = project;

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
            this.trigger('taskClicked', evt.currentTarget.hash);
        }
    });
});