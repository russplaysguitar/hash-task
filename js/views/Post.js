/*global define*/

// a single post
define(['backbone', 'jquery', 'libs/mustache'], function (Backbone, $, Mustache) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'blockquote',
        className: 'post',
        render: function () {
            var template = '<p>{{ content.text }}</p><small>{{ user }}</small>';
            this.$el.html(Mustache.render(template, this.model.toJSON()));

            return this.$el;
        }
    });
});