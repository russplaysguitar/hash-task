/*global define*/

// a single post
define(['backbone', 'jquery', 'libs/mustache'], function (Backbone, $, Mustache) {
    'use strict';
    
    return Backbone.View.extend({
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
});