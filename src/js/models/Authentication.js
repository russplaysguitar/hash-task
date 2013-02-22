/*global define*/

define(['backbone'], function (Backbone) {
    'use strict';
    return Backbone.Model.extend({
        defaults: {
            AppJSON: JSON.parse(localStorage.AppJSON || '{}'),
            AppState: localStorage.AppState,
            entity: localStorage.entity
        },
        initialize: function (atts) {
            this.on('change', function (newModel) {
                // keep localStorage sync'd
                localStorage.AppJSON = JSON.stringify(newModel.get('AppJSON') || {});
                localStorage.AppState = newModel.get('AppState') || '';
                localStorage.entity = newModel.get('entity') || '';
            });
        },
        parse: function (response, options) {
            // todo: add url validation for entity
            return response;
        }
    });
});