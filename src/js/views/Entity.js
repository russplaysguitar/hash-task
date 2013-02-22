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
            var entity = this.model.get('entity');
            // update DOM
            var rendered = Mustache.render(entityTemplate, this.model.toJSON());
            var $rendered = $(rendered);
            if (entity && entity !== '') {
                $rendered.find('.login').hide();
            }
            else {
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