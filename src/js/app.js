/*global define*/

define([
    'backbone',
    'underscore',
    'jquery',
    'app_auth',
    'models/Authentication',
    'collections/Post',
    'views/Tasks',
    'views/Post',
    'views/Posts',
    'views/Projects',
    'views/NewTask',
    'views/Entity',
    'utils/url',
    'collections/Followings'
], function (Backbone,_,$,app_auth,AuthenticationModel,PostCollection,TasksView,PostView,PostsView,ProjectsView,NewTaskView,EntityView,urlUtils,FollowingsCollection) {
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

    // all the posts are put into this collection
    var allPostsCollection = new PostCollection();
    allPostsCollection.on('add', function () {
        // refresh page when new posts are added to the collection
        Backbone.history.loadUrl(Backbone.history.fragment);
    });

    // just posts from the chosen entity
    var selfPostsCollection = new PostCollection();
    selfPostsCollection.on('reset', function (collection) {
        allPostsCollection.add(collection.models);
    });

    // posts from entity followings
    var followingsCollection = new FollowingsCollection();
    followingsCollection.on('reset', function (collection) {
        // fetch posts for each entity this user is following
        collection.each(function (following) {
            var entity = following.get('entity');
            var followingPosts = new PostCollection();
            followingPosts.url = entity + '/tent/posts';
            followingPosts.on('reset', function (fpCollection) {
                allPostsCollection.add(fpCollection.models);
            });
            followingPosts.fetch();
        });        
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

    var authModel = new AuthenticationModel();

    var newTaskView = new NewTaskView({
        el: $('.newTask'),
        model: authModel
    });

    var entityView = new EntityView({
        el: $('.tentEntity'), 
        model: authModel
    });

    // this is what is run by main.js
    return function () {

        // handle result from app authentication
        var state = urlUtils.getURLParameter('state');
        if (state) {
            app_auth(authModel).finish(function () {
                // get rid of url params
                document.location.href = document.location.origin + document.location.pathname;
            });
            return; //don't start the app yet!
        }

        // start the app
        Backbone.history.start();        

        if (authModel.get('isLoggedIn')) {
            // lookup posts and display new task form
            newTaskView.render();// show "new task" form now that an entity has been chosen
            
            followingsCollection.url = authModel.get('entity') + '/tent/followings';
            followingsCollection.fetch();

            selfPostsCollection.url = authModel.get('entity') + '/tent/posts';
            selfPostsCollection.fetch();
        }
    };
});