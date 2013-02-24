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
        initialize: function (options) {
            this.model.on('change', this.render, this);
        },
        render: function () {
            var isLoggedIn = this.model.get('isLoggedIn');
            if (isLoggedIn) {
                this.model.set('loginVisible', 'hidden');
                this.model.set('logoutVisible', '');
            }
            else {
                this.model.set('loginVisible', '');
                this.model.set('logoutVisible', 'hidden');
            }
            var rendered = Mustache.render(entityTemplate, this.model.toJSON());
            this.$el.html(rendered);
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