/*global define*/

// a list of projects
define([
    'backbone', 'underscore', 'jquery', 'libs/mustache'
], function (Backbone, _, $, Mustache) {
    return Backbone.View.extend({
        tagName: 'div',
        className: 'menu',
        events: {
            'click .btn': 'showProject'
        },
        render: function () {
            // get list of project names
            var projectNames = _.without(_.keys(this.collection.groupBy('project')), 'null');

            // update DOM
            this.$el.html('');
            var template = '<a href="#{{ name }}" class="btn btn-primary">{{ name }}</a> ';
            _.each(projectNames, function (name) {
                this.$el.append(Mustache.render(template, {name: name}));
            }, this);

            return this.$el;
        },
        showProject: function (evt) {
            var project = evt.currentTarget.hash;
            this.trigger('projectClicked', project);
        }
    });
});