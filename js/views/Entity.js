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
        initialize: function () {
            this.model = new Backbone.Model({
                entity: ''
            });
        },
        render: function () {
            // update DOM
            this.$el.html(Mustache.render(entityTemplate, { entity: this.model.get('entity')} ));
            return this.$el;
        },
        setEntity: function (evt) {
            var entity = this.$('input').val();
            this.model.set('entity', entity);
            localStorage.entity = entity;
            app_auth.auth(entity + '/tent');
            return false;
        }
    });
});