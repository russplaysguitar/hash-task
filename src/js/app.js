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
    'views/NewTask',
    'views/Entity',
    'utils/url',
    'collections/Followings'
], function (Backbone,_,$,Mustache,sjcl,app_auth,PostModel,PostCollection,TasksView,PostView,PostsView,ProjectsView,NewTaskView,EntityView,urlUtils,FollowingsCollection) {
    'use strict';

    var Router = Backbone.Router.extend({
        routes: {
            '': 'home',
            ':project': 'project',
            ':project/:task': 'task'
        },
        home: function () {
            entityView.render();
            newTaskView.render();
            projectsView.render();
            tasksView.render();
            postsView.render();
        },
        project: function (project) {
            entityView.render();
            newTaskView.render();
            projectsView.render();
            tasksView.render(project);
            postsView.render(project);
        },
        task: function (project, task) {
            entityView.render();
            newTaskView.render();
            projectsView.render();
            tasksView.render(project);
            postsView.render(project, task);
        }
    });
    var router = new Router();

    // all the posts are in this collection
    var allPostsCollection = new PostCollection();

    // just posts from the chosen entity
    var selfPostsCollection = new PostCollection();
    selfPostsCollection.on('reset', function (collection) {
        allPostsCollection.add(collection.models);
    });

    // posts from entity followings
    var followingsCollection = new FollowingsCollection();
    followingsCollection.on('reset', function (collection) {
        var self = this;
        // fetch posts for each entity this user is following
        var pending = collection.length;
        collection.each(function (following) {
            var entity = following.get('entity');
            var followingPosts = new PostCollection();
            followingPosts.url = entity + '/tent/posts';
            followingPosts.on('reset', function (fpCollection) {
                pending--;
                self.trigger('gotMoreFollowings', fpCollection);
                if (!pending) {
                    self.trigger('finishedFetchingFollowings');
                }
            });
            followingPosts.fetch();
        });        
    });

    followingsCollection.on('gotMoreFollowings', function (fpCollection) {
        // add the new posts to the main posts collection
        allPostsCollection.add(fpCollection.models);
    });
    followingsCollection.on('finishedFetchingFollowings', function () {
        Backbone.history.loadUrl(Backbone.history.fragment);// refresh page 
    });

    var projectsView = new ProjectsView({collection: allPostsCollection, el: $('.projectsList')});
    projectsView.on('projectClicked', function (project) {
        router.navigate(project, {trigger:true});
    });

    var tasksView = new TasksView({collection: allPostsCollection, el: $('.tasksList')});
    tasksView.on('taskClicked', function (location) {
        router.navigate(location, {trigger:true});
    });

    var postsView = new PostsView({collection: allPostsCollection, el: $('.postsList')});

    var newTaskView = new NewTaskView({el: $('.newTask')});

    var entityView = new EntityView({el: $('.tentEntity')});
    entityView.model.on('change:entity', function (newModel) {
        // whenever the entity changes, re-fetch all the posts
        var entity = newModel.get('entity');
        if (entity) {
            newTaskView.render();// show "new task" form now that an entity has been chosen
            
            followingsCollection.url = newModel.get('entity') + '/tent/followings';
            followingsCollection.fetch();

            selfPostsCollection.url = newModel.get('entity') + '/tent/posts';
            selfPostsCollection.fetch();
        }
    });

    // this is what is run by main.js
    return function () {

        // handle result from app authentication
        var state = urlUtils.getURLParameter('state');
        if (state) {
            app_auth.finish(function () {
                document.location.href = document.location.origin + document.location.pathname;
                return; //don't start the app yet!
            });
        }

        // start the app
        Backbone.history.start();        

        // set the entity, which triggers posts lookup
        if (localStorage.entity) {
            entityView.model.set('entity', localStorage.entity);
        }
    };
});