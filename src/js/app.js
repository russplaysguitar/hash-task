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
    var postsCollection = new PostCollection();

    var projectsView = new ProjectsView({collection: postsCollection, el: $('.projectsList')});
    projectsView.on('projectClicked', function (project) {
        router.navigate(project, {trigger:true});
    });

    var tasksView = new TasksView({collection: postsCollection, el: $('.tasksList')});
    tasksView.on('taskClicked', function (location) {
        router.navigate(location, {trigger:true});
    });

    var postsView = new PostsView({collection: postsCollection, el: $('.postsList')});

    var followingsCollection = new FollowingsCollection();
    followingsCollection.on('gotMoreFollowings', function (fpCollection) {
        // add the new posts to the main posts collection
        postsCollection.add(fpCollection.models);
    });
    followingsCollection.on('finishedFetchingFollowings', function () {
        Backbone.history.loadUrl(Backbone.history.fragment);// refresh page 
    });

    postsCollection.on('finished_fetch', function () {
        followingsCollection.fetch();
    });

    var newTaskView = new NewTaskView({el: $('.newTask')});

    var entityView = new EntityView({el: $('.tentEntity')});
    entityView.model.on('change:entity', function (newModel) {
        // whenever the entity changes, re-fetch all the posts
        var entity = newModel.get('entity');
        if (entity) {
            newTaskView.render();// show "new task" form now that an entity has been chosen
            
            followingsCollection.url = newModel.get('entity') + '/tent/followings';
            postsCollection.url = newModel.get('entity') + '/tent/posts';
            postsCollection.fetch({
                success: function () {
                    postsCollection.trigger('finished_fetch');
                }
            });// will trigger followingsCollection.fetch() on success
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