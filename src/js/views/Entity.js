/*global define,localStorage*/

define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'app_auth', 'text!templates/entity.html'
], function (Backbone, _, $, Mustache, app_auth, entityTemplate) {
    'use strict';

    return Backbone.View.extend({
        tagName: 'div',
        className: '',
        events: {
            'click .login': 'setEntity',
            'click .logout': 'unsetEntity'
        },
        render: function () {
            var isLoggedIn = this.model.get('isLoggedIn');
            // update DOM
            var rendered = Mustache.render(entityTemplate, this.model.toJSON());
            var $rendered = $(rendered);
            if (isLoggedIn) {
                $rendered.find('.login').hide();
                $rendered.find('.logout').show();
            }
            else {
                $rendered.find('.login').show();
                $rendered.find('.logout').hide();
            }
            this.$el.html($rendered);
            return this.$el;
        },
        setEntity: function (evt) {
            var entity = this.$('input').val();
            this.model.set('entity', entity);
            if (entity && entity !== '') {
                app_auth(this.model).auth(entity + '/tent');
            }
        },
        unsetEntity: function (evt) {
            this.model.clear();
            document.location.reload();
        }
    });
});