/*global define*/ 

// TODO: refactor this!!!!!
// represents a collection of entities that are being followed
define(['backbone', 'underscore', 'collections/Post'], function (Backbone, _, PostCollection) {
    'use strict';
    return Backbone.Collection.extend({
        initialize: function () {
            var fetch_opts = {
                success: _.bind(function (collection) {
                    var self = this;
                    // fetch posts for each entity this user is following
                    var pending = collection.length;
                    collection.each(function (following) {
                        pending--;
                        var entity = following.get('entity');
                        var followingPosts = new PostCollection();
                        followingPosts.url = entity + '/tent/posts';
                        followingPosts.fetch({
                            success: function (fpCollection) {
                                self.trigger('gotMoreFollowings', fpCollection);
                                if (!pending) {
                                    self.trigger('finishedFetchingFollowings');
                                }
                            }
                        });
                    });
                }, this)
            };
            this.fetch = _.partial(this.fetch, fetch_opts);
        }
    });
});