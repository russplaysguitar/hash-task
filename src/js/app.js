/*global Backbone,_,$*/
(function () {
    'use strict';

    // represents a single post
    var PostModel = Backbone.Model.extend({
        taskPattern: /\#([\w_\d]+)\/([\w_\d]+)/,
        statusPattern: /\#(open|assign|close)/i,
        labelPattern: /\#([\w_\d]+)/gi,
        parse: function (post) {
            var text = post.content.text,
                taskMatches = this.taskPattern.exec(text),
                project = taskMatches ? taskMatches[1] : null,
                task = taskMatches ? taskMatches[2]: null;

            this.set('project', project);
            this.set('task', task);

            var statusMatch = this.statusPattern.exec(text);
            var status = statusMatch ? statusMatch[1] : null;
            this.set('status', status);

            var labels = [];
            var match;
            while((match = this.labelPattern.exec(text))) {
                var label = match[1];
                labels.push(label);
            }
            this.set('labels', labels);

            this.set('user', post.entity);

            return post;
        }
    });

    // represents a collection of posts
    var PostCollection = Backbone.Collection.extend({
        model: PostModel,
        url: 'https://russ.tent.is/tent/posts',
        parse: function (json) {
            // find labels that reference projects (for posts without explicit project references)
            _.defer(_.bind(function () {
                var projects = this.groupBy('project');
                var projectList = _.keys(projects);

                this.each(function (post) {// TODO: don't re-loop it all, just loop the new stuff?
                    var labelsOfProjects = _.intersection(post.get('labels'), projectList);

                    if (!post.get('project') && _.size(labelsOfProjects)) {
                        post.set('project', labelsOfProjects[0]);// just take the first one referenced (for now)
                    }
                });
            }, this));

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

    var postsCollection = new PostCollection();

    // not sure if this should be broken out into multiple views...
    var ProjectsView = Backbone.View.extend({
        tagName: 'div',
        className: 'project',
        events: {
            'click .name': 'showProject'
        },
        showProject: function (evt) {
            var project = evt.currentTarget.hash;
            var projects = this.collection.filter(function (post) {
                return post.get('project') == project.substring(1, project.length);
            });
            _.each(projects, function (post) {
                this.$el.append(post.get('content').text);
            }, this);
        },
        initialize: function () {
            var self = this;
            this.collection.fetch({
                success: function () {
                    self.render();
                }
            });
        },
        render: function () {
            var self = this;
            var projectNames = _.keys(this.collection.groupBy('project'));

            _.each(projectNames, function (name) {
                self.$el.append('<a href="#' + name + '" class="name">' + name + '</a><br />');
            });

        }
    });

    var pView = new ProjectsView({collection: postsCollection});

    $('html').append(pView.$el);

    // var postsWithTasks = _.filter(posts, function (post) {
    //     return post.type == "https://tent.io/types/post/status/v0.1.0" && PostModel.prototype.taskPattern.test(post.content.text);
    // });

    // var seniorProjectCollection = new PostCollection(postsCollection.filter(function(v){
    //     return v.get('project') == 'senior_project';
    // }));

    // var project = new ProjectModel(seniorProjectCollection);

}());