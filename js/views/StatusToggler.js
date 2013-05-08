/*global define*/

// the issue status toggler
define(['backbone', 'jquery', 'underscore', 'libs/mustache', 'text!templates/status_toggler.html', 'utils/url'], 
    function (Backbone, $, _, Mustache, StatusTogglerTemplate, urlUtils) {
    'use strict';
    
    return Backbone.View.extend({
        tagName: 'div',
        className: 'statusToggler',
        events: {
            'click button': 'statusClicked'
        },
        initialize: function (options) {
            options.collection.on('change', function () { 
                this.render();
            }, this);
        },
        render: function (project) {
            // get posts for project
            var posts = this.collection.filter(function (post) {
                return post.get('project') === project;
            });

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

            // hide or show the element
            if (_.size(posts) && this.$el.is(':hidden')) {
                this.$el.show();
            }
            else if (!_.size(posts) && this.$el.is(':visible')){
                this.$el.hide();
            }
        },
        statusClicked: function (evt) {
            var status = $(evt.currentTarget).text();
            status = status === 'All' ? null : status.toLowerCase();
            this.trigger('statusClicked', status);
        }
    });
});