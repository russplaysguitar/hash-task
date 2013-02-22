/*global define*/ 

// represents a collection of posts
define(['backbone', 'underscore', 'models/Post'], function (Backbone, _, PostModel) {
    'use strict';
    
    return Backbone.Collection.extend({
        model: PostModel,
        initialize: function (options) {
            this.on('reset', function (collection) {
                // find labels that reference projects (for posts without explicit project references)
                var projects = this.groupBy('project');
                var projectList = _.keys(projects);

                collection.each(function (post) {
                    var labelsOfProjects = _.intersection(post.get('labels'), projectList);

                    if (!post.get('project') && _.size(labelsOfProjects)) {
                        post.set('project', labelsOfProjects[0]);// just take the first one referenced (for now)
                    }
                });
            }, this);
        },
        parse: function (json) {
            // only put status posts into the collection
            return _.filter(json, function (post) {
                return post.type === 'https://tent.io/types/post/status/v0.1.0';
            });
        },
        byTaskForProject: function (projectName) {// useful??
            return _.groupBy(this.groupBy('project')[projectName], function (model) {
                return model.get('task');
            }, this);
        }
    });
 });