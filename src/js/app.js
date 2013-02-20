/*global define*/

define([
    'backbone',
    'underscore',
    'jquery',
    'libs/mustache',
    'sjcl',
    'app_auth',
    'models/Post',
    'collections/Post',
    'views/Tasks',
    'views/Post',
    'views/Posts',
    'views/Projects',
    'views/NewTask'
], function (Backbone,_,$,Mustache,sjcl,app_auth,PostModel,PostCollection,TasksView,PostView,PostsView,ProjectsView,NewTaskView) {
    'use strict';

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
    projectsView.on('projectClicked', function (project) {
        router.navigate(project, {trigger:true});
    });
    var tasksView = new TasksView({collection: postsCollection});
    tasksView.on('taskClicked', function (location) {
        router.navigate(location, {trigger:true});
    });
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

    // this is what is run by main.js
    return function () {
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
    };
});