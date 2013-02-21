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
            postsView.render();
        },
        task: function (project, task) {
            entityView.render();
            newTaskView.render();
            projectsView.render();
            tasksView.render(project);
            postsView.render(task);
        }
    });
    var router = new Router();

    // all the posts are in this collection
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

    var followingsCollection = new FollowingsCollection();
    followingsCollection.on('gotMoreFollowings', function (fpCollection) {
        // add the new posts to the main posts collection
        postsCollection.add(fpCollection.models);
    });
    followingsCollection.on('finishedFetchingFollowings', function () {
        Backbone.history.loadUrl(Backbone.history.fragment);// refresh page 
    });

    var newTaskView = new NewTaskView();

    var entityView = new EntityView();
    entityView.model.on('change:entity', function (newModel) {
        var entity = newModel.get('entity');
        if (entity) {
            postsCollection.url = newModel.get('entity') + '/tent/posts';
            postsCollection.fetch();

            followingsCollection.url = newModel.get('entity') + '/tent/followings';
            followingsCollection.fetch();

            newTaskView.render();
        }
    });

    // this is what is run by main.js
    return function () {
        // setup elements
        $('.tentEntity').html(entityView.el);
        $('.newTask').html(newTaskView.el);
        $('.projectsList').html(projectsView.el);
        $('.tasksList').html(tasksView.el);
        $('.postsList').html(postsView.el);

        // handle result from app authentication
        var state = urlUtils.getURLParameter('state');
        if (state) {
            app_auth.finish(function () {
                document.location.href = document.location.origin + document.location.pathname;
            });
        }

        // start the app
        Backbone.history.start();
        if (localStorage.entity) {
            entityView.model.set('entity', localStorage.entity);
        }
    };
});