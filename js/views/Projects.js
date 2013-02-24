/*global define*/

// a list of projects
define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'utils/url', 'text!templates/projects.html'
], function (Backbone, _, $, Mustache, urlUtils, ProjectsTemplate) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'menu',
        events: {
            'click .btn': 'showProject'
        },
        initialize: function (options) {
            options.collection.on('change', function () { 
                this.render();
            }, this);
        },
        render: function () {
            var currentProject = urlUtils.getProject();

            // get list of project names as {name: project}
            var projectNames = _.without(_.keys(this.collection.groupBy('project')), 'null', 'undefined');
            projectNames = _.map(projectNames, function (project) {
                var active = project === currentProject ? 'active' : '';
                return {name: project, active: active };
            });

            this.$el.html(Mustache.render(ProjectsTemplate, {projectNames: projectNames}));
        },
        showProject: function (evt) {
            var project = evt.currentTarget.hash;
            this.trigger('projectClicked', project);
        }
    });
});