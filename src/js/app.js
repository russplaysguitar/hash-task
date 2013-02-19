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

            // get posts for project
            var posts = this.collection.filter(function (post) {
                return post.get('project') === project;
            });

            // get tasks for project
            var tasks = _.without(_.keys(_.groupBy(posts, function (post) {
                return post.get('task'); })), 'null');

            // update DOM
            this.$el.html('');
            var template = _.template('<a href="<%= location %>" class="btn btn-success"><%= task %></a> ');
            var locParts = document.location.hash.split('/');
            _.each(tasks, function (task) {
                locParts[1] = task;
                this.$el.append(template({location: locParts.join('/'), task: task}));
            }, this);

            return this.$el;
        },
        showTask: function (evt) {
            var location = evt.currentTarget.hash;
            router.navigate(location, {trigger:true});
        }
    });

    // a single post
    var PostView = Backbone.View.extend({
        tagName: 'blockquote',
        className: 'post',
        render: function () {
            this.$el.html('');
            var template = _.template('<p><%= text %></p><small><%= user %></small>');
            this.$el.html(template({
                text: this.model.get('content').text,
                user: this.model.get('user')
            }));

            return this.$el;
        }
    });

    // a list of posts for a given task
    var PostsView = Backbone.View.extend({
        tagName: 'div',
        className: 'tasks',
        render: function (task) {
            // get posts for task
            var posts = this.collection.filter(function (post) {
                return post.get('task') === task;
            });

            // update DOM
            this.$el.html('');
            _.each(posts, function (post) {
                var postView = new PostView({model: post});
                this.$el.append(postView.render());
            }, this);

            return this.$el;
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
            // get list of project names
            var projectNames = _.without(_.keys(this.collection.groupBy('project')), 'null');

            // update DOM
            this.$el.html('');
            var template = _.template('<a href="#<%= name %>" class="btn btn-primary"><%= name %></a> ');
            _.each(projectNames, function (name) {
                this.$el.append(template({name: name}));
            }, this);

            return this.$el;
        },
        showProject: function (evt) {
            var project = evt.currentTarget.hash;
            router.navigate(project, {trigger:true});
        }
    });

    var NewTaskView = Backbone.View.extend({
        tagName: 'div',
        className: '',
        events: {
            'submit': 'newPost'
        },
        render: function () {
            // update DOM
            this.$el.html('');
            var template = _.template(
                '<form>' +
                '<textarea name="comment" placeholder="Task comment" required></textarea><br />' +
                '<input type="submit" value="New Task" class="btn btn-inverse">' +
                '</form>'
            );
            this.$el.append(template());
            return this.$el;
        },
        newPost: function (evt) {

            return false;
        }
    });

    var Router = Backbone.Router.extend({
        routes: {
            '': 'home',
            ':project': 'project',
            ':project/:task': 'task'
        },
        home: function () {
            $('.newTask').html(newTaskView.render());
            $('.projectsList').html(projectsView.render());
            $('.tasksList').html('');
            $('.postsList').html('');
        },
        project: function (project) {
            $('.newTask').html(newTaskView.render());
            $('.projectsList').html(projectsView.render());
            $('.tasksList').html(tasksView.render(project));
            $('.postsList').html('');
        },
        task: function (project, task) {
            $('.newTask').html(newTaskView.render());
            $('.projectsList').html(projectsView.render());
            $('.tasksList').html(tasksView.render(project));
            $('.postsList').html(postsView.render(task));
        }
    });
    var router = new Router();

    var postsCollection = new PostCollection();
    postsCollection.url = 'https://russ.tent.is/tent/posts';
    postsCollection.fetch();

    var projectsView = new ProjectsView({collection: postsCollection});
    var tasksView = new TasksView({collection: postsCollection});
    var postsView = new PostsView({collection: postsCollection});
    var newTaskView = new NewTaskView();

    var followingsCollection = new Backbone.Collection();
    followingsCollection.url = 'https://russ.tent.is/tent/followings';
    followingsCollection.fetch({
        success: function (collection) {
            var pendingSyncs = 0;
            // fetch posts for each entity this user is following
            collection.each(function (following) {
                var entity = following.get('entity');
                var followingPosts = new PostCollection();
                followingPosts.url = entity + '/tent/posts';
                pendingSyncs++;
                followingPosts.fetch({
                    success: function (fpCollection) {
                        // add the new posts to the main posts collection
                        postsCollection.add(fpCollection.models);
                        pendingSyncs--;
                        if (!pendingSyncs) {
                            Backbone.history.start();
                        }
                    }
                });
            });
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