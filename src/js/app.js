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
    'utils/url',
    'collections/Followings'
], function (Backbone,_,$,app_auth,AuthenticationModel,PostCollection,TasksView,PostView,PostsView,ProjectsView,NewPostView,EntityView,WelcomeView,urlUtils,FollowingsCollection) {
    'use strict';

    var Router = Backbone.Router.extend({
        routes: {
            '': 'everything',
            ':project': 'everything',
            ':project/:task': 'everything'
        },
        everything: function (project, task) {
            entityView.render();
            newPostView.render();
            projectsView.render();
            tasksView.render(project);
            postsView.render(project, task);
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