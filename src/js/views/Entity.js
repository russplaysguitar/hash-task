/*global define,localStorage*/

define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'app_auth', 'text!templates/entity.html'
], function (Backbone, _, $, Mustache, app_auth, entityTemplate) {
    'use strict';

    return Backbone.View.extend({
        tagName: 'div',
        className: '',
        events: {
            'click .btn': 'setEntity'
        },
        render: function () {
            // update DOM
            this.$el.html(Mustache.render(entityTemplate, this.model.toJSON() ));
            return this.$el;
        },
        setEntity: function (evt) {
            var entity = this.$('input').val();
            this.model.set('entity', entity);
            if (entity && entity !== '') {
                app_auth.auth(entity + '/tent');
            }
        }
    });
});