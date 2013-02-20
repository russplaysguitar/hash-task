/*global Backbone,_,$,Mustache,sjcl,app_auth*/
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
            var location = evt.currentTarget.hash;
            router.navigate(location, {trigger:true});
        }
    });

    // a single post
    var PostView = Backbone.View.extend({
        tagName: 'blockquote',
        className: 'post',
        render: function () {
            var template = '<p>{{ text }}</p><small>{{ user }}</small>';
            this.$el.html(Mustache.render(template, {
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
        task: null,
        render: function (task) {
            task = task ? task : this.task;
            this.task = task;

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
            var template = '<a href="#{{ name }}" class="btn btn-primary">{{ name }}</a> ';
            _.each(projectNames, function (name) {
                this.$el.append(Mustache.render(template, {name: name}));
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
            'click .btn': 'newPost'
        },
        render: function () {
            if (localStorage.entity) {
                // update DOM
                var template = 
                    '<form action="javascript:;" class="form-horizontal"><div class="control-group">' +
                    '<textarea class="comment" name="comment" placeholder="Task comment" required></textarea><br />' +
                    '<button type="submit" class="btn btn-inverse">New Task</button>' +
                    '</div></form>'
                ;
                this.$el.html(template);
            }
            else {
                this.$el.html('');
            }
            return this.$el;
        },
        newPost: function (evt) {
            var AppJSON = JSON.parse(localStorage.AppJSON);
            var matches = /^(http|https):\/\/([.\d\w\-]+)/.exec(localStorage.entity);
            var host = matches[2];

            // prepare request string for hmac signature
            var request = {
                method: 'POST',
                path: '/tent/posts',
                host: host,
                port: 443
            };
            var date = new Date(),
                timestamp = parseInt((date * 1) / 1000, 10),
                nonce = Math.random().toString(16).substring(3),
                request_string = [timestamp, nonce, request.method.toUpperCase(), request.path, request.host, request.port, null, null].join("\n");

            // create base64-encoded hash token for authentication
            // TODO: support other encryptions. (currently assuming sha-256-hmac)
            var hmac = new sjcl.misc.hmac(sjcl.codec.utf8String.toBits(AppJSON.mac_key));
            var signature = sjcl.codec.base64.fromBits(hmac.mac(request_string));

            var data = {
                "type": "https://tent.io/types/post/status/v0.1.0",
                "published_at": timestamp,
                "permissions": {
                    "public": true
                },
                "licenses": [
                    "http://creativecommons.org/licenses/by/3.0/"
                ],
                "content": {
                    "text": this.$('.comment').val()
                }
            };

            var self = this;
            $.ajax({
                url: 'https://' + request.host + request.path,
                type: request.method,
                contentType: 'application/vnd.tent.v0+json',
                headers: {
                    'Accept': 'application/vnd.tent.v0+json',
                    'Authorization': 'MAC id="'+AppJSON.access_token+'", ts="'+timestamp+'", nonce="'+nonce+'", mac="'+signature+'"'
                },
                data: JSON.stringify(data),
                success: function () {
                    self.$('.comment').val('');
                    Backbone.history.loadUrl(Backbone.history.fragment);// refresh page 
                }
            });
        }
    });

    var EntityView = Backbone.View.extend({
        tagName: 'div',
        className: '',
        events: {
            'click .btn': 'setEntity'
        },
        initialize: function () {
            this.model = new Backbone.Model({
                entity: ''
            });
        },
        render: function () {
            // update DOM
            var template = 
                '<form class="form-inline"><div class="control-group">' +
                '<input type="url" placeholder="https://yourname.tent.is" value="{{ entity }}" required>' +
                '<button type="submit" class="btn">Submit</button>' +
                '</div></form>'
            ;
            this.$el.html(Mustache.render(template, { entity: this.model.get('entity')} ));
            return this.$el;
        },
        setEntity: function (evt) {
            var entity = this.$('input').val();
            this.model.set('entity', entity);
            localStorage.entity = entity;
            app_auth.auth(entity + '/tent');
            return false;
        }
    });

    // todo put this in lib shared with app_auth
    // returns the value of a url parameter
    var getURLParameter = function (name) {
        // from: http://stackoverflow.com/questions/1403888/get-url-parameter-with-jquery
        return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[null,""])[1].replace(/\+/g, '%20'))||null;
    };

    var Router = Backbone.Router.extend({
        routes: {
            '': 'home',
            ':project': 'project',
            ':project/:task': 'task'
        },
        home: function () {
            $('.tentEntity').html(entityView.render());
            $('.newTask').html(newTaskView.render());
            $('.projectsList').html(projectsView.render());
            $('.tasksList').html('');
            $('.postsList').html('');
        },
        project: function (project) {
            $('.tentEntity').html(entityView.render());
            $('.newTask').html(newTaskView.render());
            $('.projectsList').html(projectsView.render());
            $('.tasksList').html(tasksView.render(project));
            $('.postsList').html('');
        },
        task: function (project, task) {
            $('.tentEntity').html(entityView.render());
            $('.newTask').html(newTaskView.render());
            $('.projectsList').html(projectsView.render());
            $('.tasksList').html(tasksView.render(project));
            $('.postsList').html(postsView.render(task));
        }
    });
    var router = new Router();

    var postsCollection = new PostCollection();
    var projectsView = new ProjectsView({collection: postsCollection});
    var tasksView = new TasksView({collection: postsCollection});
    var postsView = new PostsView({collection: postsCollection});

    var FollowingsCollection = Backbone.Collection.extend({
        fetch_opts: {
            success: function (collection) {
                // fetch posts for each entity this user is following
                var pending = collection.length;
                collection.each(function (following) {
                    pending--;
                    var entity = following.get('entity');
                    var followingPosts = new PostCollection();
                    followingPosts.url = entity + '/tent/posts';
                    followingPosts.fetch({
                        success: function (fpCollection) {
                            // add the new posts to the main posts collection
                            postsCollection.add(fpCollection.models);
                            if (!pending) {
                                entityView.render();
                                newTaskView.render();
                                projectsView.render();
                                tasksView.render();
                                postsView.render();
                            }
                        }
                    });
                });
            }
        }
    });
    var followingsCollection = new FollowingsCollection();

    var newTaskView = new NewTaskView();
    var entityView = new EntityView();
    entityView.model.on('change:entity', function (newModel) {
        var entity = newModel.get('entity');
        if (entity) {
            postsCollection.url = newModel.get('entity') + '/tent/posts';
            postsCollection.fetch();

            followingsCollection.url = newModel.get('entity') + '/tent/followings';
            followingsCollection.fetch(followingsCollection.fetch_opts);

            newTaskView.render();
        }
    });

    $(document).ready(function () {

        var state = getURLParameter('state');
        if (state) {
            app_auth.finish(function () {
                document.location.href = document.location.origin + document.location.pathname;
            });
        }
        Backbone.history.start();
        if (localStorage.entity) {
            entityView.model.set('entity', localStorage.entity);
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