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
            'click .logout': 'unsetEntity',
            'submit .loginForm': 'setEntity'
        },
        initialize: function (options) {
            this.model.on('change', this.render, this);
        },
        render: function () {
            var isLoggedIn = this.model.get('isLoggedIn');
            if (isLoggedIn) {
                this.model.set('loginVisible', 'hidden');
                this.model.set('logoutVisible', '');
                this.model.set('inputDisabled', 'disabled');
            }
            else {
                this.model.set('loginVisible', '');
                this.model.set('logoutVisible', 'hidden');
                this.model.set('inputDisabled', '');
            }
            var rendered = Mustache.render(entityTemplate, this.model.toJSON());
            this.$el.html(rendered);
        },
        setEntity: function (evt) {
            var entity = this.$('input').val();
            this.model.set('entity', entity, {silent: true});
            if (entity && entity !== '') {
                app_auth(this.model).auth(entity + '/tent');
            }
        },
        unsetEntity: function (evt) {
            this.model.clear();
            document.location.hash = '';
            document.location.reload(true);
        }
    });
});