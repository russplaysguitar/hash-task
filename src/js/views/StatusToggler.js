/*global define*/

// the issue status toggler
define(['backbone', 'jquery', 'libs/mustache', 'text!templates/status_toggler.html', 'utils/url'], 
    function (Backbone, $, Mustache, StatusTogglerTemplate, urlUtils) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'statusToggler',
        events: {
            'click button': 'statusClicked'
        },
        initialize: function () {
            // this.model.set('openActive', 'active');
        },
        render: function () {
            // get currently selected status
            var status = urlUtils.getStatus();

            switch (status) {
                case 'all':
                    this.model.set('allActive', 'active');
                    this.model.set('openActive', '');
                    this.model.set('closedActive', '');
                    break;
                case 'open':
                    this.model.set('allActive', '');
                    this.model.set('openActive', 'active');
                    this.model.set('closedActive', '');
                    break;
                case 'closed':
                    this.model.set('allActive', '');
                    this.model.set('openActive', '');
                    this.model.set('closedActive', 'active');
                    break;
                default:
                    this.model.set('allActive', 'active');
                    this.model.set('openActive', '');
                    this.model.set('closedActive', '');
            }

            this.$el.html(Mustache.render(StatusTogglerTemplate, this.model.toJSON()));

            return this.$el;
        },
        statusClicked: function (evt) {
            var status = $(evt.currentTarget).text();
            status = status === 'All' ? null : status.toLowerCase();
            this.trigger('statusClicked', status);
        }
    });
});