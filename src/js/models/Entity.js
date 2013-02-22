/*global define */

define(['backbone'], function (Backbone){
    'use strict';
    return Backbone.Model.extend({
        defaults: {
            entity: localStorage.entity || ''
        },
        initialize: function (atts) {
            this.on('change:entity', function (newModel) {
                localStorage.entity = newModel.get('entity');
            });
        },
        parse: function (response, options) {
            // todo: add url validation
            return response;
        }
    });
});