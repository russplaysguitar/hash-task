/*global define*/

define([
    'backbone', 'underscore', 'jquery', 'libs/mustache', 'app_auth'
], function (Backbone, _, $, Mustache, app_auth) {
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
            var template = 
                '<form class="form-inline"><div class="control-group">' +
                '<input type="url" placeholder="https://yourname.tent.is" value="{{ entity }}" required>' +
                '<button type="submit" class="btn">Submit</button>' +
                '</div></form>'
            ;
            this.$el.html(Mustache.render(template, { entity: this.model.get('entity')} ));
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