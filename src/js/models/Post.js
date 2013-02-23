/*global define */

// represents a single post
define(['backbone'], function (Backbone){
    'use strict';
    
    return Backbone.Model.extend({
        defaults: {
            user: null,
            project: null,
            task: null,
            status: null,
            labels: [],
            content: {
                text: null
            }
        },
        taskPattern: /\#([\w_\d]+)\/([\w_\d]+)/,
        statusPattern: /\#(open|assign|close)/i,
        labelPattern: /\#([\w_\d]+)/gi,
        parse: function (post) {
            var text = post.content.text,
                taskMatches = this.taskPattern.exec(text),
                project = taskMatches ? taskMatches[1] : null,
                task = taskMatches ? taskMatches[2]: null;

            post.project = project;
            post.task = task;

            var statusMatch = this.statusPattern.exec(text);
            post.status = statusMatch ? statusMatch[1] : null;

            post.labels = [];
            var match;
            while((match = this.labelPattern.exec(text))) {
                var label = match[1];
                post.labels.push(label);
            }

            post.user = post.entity;

            return post;
        }
    });
});