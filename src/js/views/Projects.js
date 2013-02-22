/*global define*/

// a list of projects
define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'text!templates/projects.html'
], function (Backbone, _, $, Mustache, ProjectsTemplate) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'menu',
        events: {
            'click .btn': 'showProject'
        },
        initialize: function (options) {
            // options.collection.on('change', function () { 
            //     this.render();
            // }, this);
        },
        render: function () {
            // get list of project names as {name: project}
            var projectNames = _.without(_.keys(this.collection.groupBy('project')), 'null', 'undefined');
            projectNames = _.map(projectNames, function (project) {
                return {name: project};
            });

            this.$el.html(Mustache.render(ProjectsTemplate, {projectNames: projectNames}));

            return this.$el;
        },
        showProject: function (evt) {
            var project = evt.currentTarget.hash;
            this.trigger('projectClicked', project);
        }
    });
});