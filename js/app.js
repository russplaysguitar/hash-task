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
    'views/NewPost',
    'views/Entity',
    'views/Welcome',
    'views/StatusToggler',
    'utils/url',
    'collections/Followings'
], function (Backbone,_,$,app_auth,AuthenticationModel,PostCollection,TasksView,PostView,PostsView,ProjectsView,NewPostView,EntityView,WelcomeView,StatusToggerView,urlUtils,FollowingsCollection) {
    'use strict';

    var Router = Backbone.Router.extend({
        routes: {
            '*path': 'handleAnyRoute'
        },
        handleAnyRoute: function (path) {
            var project = urlUtils.getProject(),
                task = urlUtils.getTask(),
                status = urlUtils.getStatus();

            entityView.render();
            newPostView.render();
            projectsView.render();
            statusTogglerView.render(project);
            tasksView.render(project, status);
            postsView.render(project, task);
            postsView.render(project, task, status);
        }
    });
    var router = new Router();

    var loadingMonitor = new Backbone.Model({
        selfPostsDone: false,
        followingPostsDone: false
    });
    loadingMonitor.on('change', function (newModel) {
        if (newModel.get('selfPostsDone') === true && 
            newModel.get('followingPostsDone') === true) {
            Backbone.history.loadUrl(Backbone.history.fragment);
        }
    });

    // all the posts are put into this collection
    var allPostsCollection = new PostCollection();

    // just posts from the chosen entity
    var selfPostsCollection = new PostCollection();
    selfPostsCollection.on('reset', function (collection) {
        allPostsCollection.add(collection.models);
        loadingMonitor.set('selfPostsDone', true);
    });

    // posts from entity followings
    var followingsCollection = new FollowingsCollection();
    followingsCollection.on('reset', function (collection) {
        var waitingCount = collection.length;
        // fetch posts for each entity this user is following
        collection.each(function (following) {
            var entity = following.get('entity');
            var followingPosts = new PostCollection();
            followingPosts.url = entity + '/tent/posts';
            followingPosts.on('reset', function (fpCollection) {
                allPostsCollection.add(fpCollection.models);
                waitingCount -= 1;
                if (waitingCount === 0) {
                    loadingMonitor.set('followingPostsDone', true);
                }
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

    var newPostView = new NewPostView({
        el: $('.newPost'),
        authModel: authModel,
        allPosts: allPostsCollection
    });
    newPostView.on('posted', function () {
        loadingMonitor.set('selfPostsDone', false);
        selfPostsCollection.fetch();
    });

    var entityView = new EntityView({
        el: $('.tentEntity'), 
        model: authModel
    });

    var statusTogglerView = new StatusToggerView({
        el: $('.statusToggler'),
        model: new Backbone.Model(),
        collection: allPostsCollection
    });
    statusTogglerView.on('statusClicked', function (status) {
        var locParts = document.location.hash.split('/');
        locParts[2] = status;
        var location = locParts.join('/');
        router.navigate(location, {trigger:true});
    });

    // this is what is run by main.js
    return function () {

        // handle result from app authentication
        var state = urlUtils.getURLParameter('state');
        if (state) {
            app_auth(authModel).finish(function () {
                // get rid of url params
                document.location.href = document.location.origin + document.location.pathname + document.location.hash;
            });
            return; //don't start the app yet!
        }

        // start the app
        Backbone.history.start();        

        if (authModel.get('isLoggedIn')) {
            // lookup posts now
            followingsCollection.url = authModel.get('entity') + '/tent/followings';
            followingsCollection.fetch();

            selfPostsCollection.url = authModel.get('entity') + '/tent/posts';
            selfPostsCollection.fetch();
        }
        else {
            // show welcome screen
            var welcomeView = new WelcomeView({
                el: $('.welcome')
            });
        }
    };
});