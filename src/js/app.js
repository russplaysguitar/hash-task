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


    // a list of tasks for a given project
    var TasksView = Backbone.View.extend({
        tagName: 'div',
        className: 'project',
        events: {
            'click .btn': 'showTask'
        },
        render: function (project) {
            this.$el.html('');

            // get posts for project
            var posts = this.collection.filter(function (post) {
                return post.get('project') === project;
            });

            // get tasks for project
            var tasks = _.keys(_.groupBy(posts, function (post) { return post.get('task'); }));
            var tasks = _.without(tasks, 'null');

            // append tasks to this
            var locParts = document.location.hash.split('/');
            _.each(tasks, function (task) {
                locParts[1] = task;
                var location = locParts.join('/');
                this.$el.append('<a href="' + location + '" class="btn btn-success">' + task + '</a> ');
            }, this);

            return this.$el.html();
        },
        showTask: function () {
            var location = evt.currentTarget.hash;
            router.navigate(location, {trigger:true});
        }
    });

    // a list of posts for a given task
    var PostsView = Backbone.View.extend({
        tagName: 'div',
        className: 'tasks',
        render: function (task) {
            this.$el.html('');

            var posts = this.collection.filter(function (post) {
                return post.get('task') === task;
            });

            _.each(posts, function (post) {
                this.$el.append('<p class="lead">' + post.get('content').text + '</p>');
            }, this);

            return this.$el.html();
        }
    });

    // a list of projects
    var ProjectsView = Backbone.View.extend({
        tagName: 'div',
        className: 'menu',
        events: {
            'click .btn': 'showProject'
        },
        render: function () {
            this.$el.html('');
            
            var projectNames = _.without(_.keys(this.collection.groupBy('project')), 'null');

            _.each(projectNames, function (name) {
                this.$el.append('<a href="#' + name + '" class="btn btn-primary">' + name + '</a> ');
            }, this);

            return this.$el.html();
        },
        showProject: function (evt) {
            var project = evt.currentTarget.hash;
            router.navigate(project, {trigger:true});
        }        
    });


    var Router = Backbone.Router.extend({
        routes: {
            '': 'home',
            ':project': 'project',
            ':project/:task': 'task'
        },
        home: function () {
            $('#projectsList').html(menuView.render());
        },
        project: function (project) {
            $('#projectsList').html(menuView.render());
            $('#tasksList').html(pView.render(project));
        },
        task: function (project, task) {
            $('#projectsList').html(menuView.render());
            $('#tasksList').html(pView.render(project));
            $('#postsList').html(tView.render(task));
        }
    });

    var postsCollection = new PostCollection();

    var menuView = new ProjectsView({collection: postsCollection});
    var tView = new PostsView({collection: postsCollection});
    var pView = new TasksView({collection: postsCollection});    

    var router = new Router();

    postsCollection.fetch({
        success: function () {
            Backbone.history.start();
        }
    });

    // var postsWithTasks = _.filter(posts, function (post) {
    //     return post.type == 'https://tent.io/types/post/status/v0.1.0' && PostModel.prototype.taskPattern.test(post.content.text);
    // });

    // var seniorProjectCollection = new PostCollection(postsCollection.filter(function(v){
    //     return v.get('project') == 'senior_project';
    // }));

    // var project = new ProjectModel(seniorProjectCollection);

}());