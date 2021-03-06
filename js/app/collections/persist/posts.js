define([
  'backbone',
  'app/models/post',
  'app/collections/encryptedDatastore'
], function(Backbone, Post, EncryptedDatastore){

var Posts = Backbone.Collection.extend({
    model: Post,

    dropboxDatastore: new EncryptedDatastore('Posts_7'),

    initialize: function() {
        this.dropboxDatastore.syncCollection(this);
    },

    comparator: function(post) {
        return -post.get('created');
    },

    toManifest: function(friend) {
        var filteredPosts = [];
        this.each(function(post) {
            var permissions = post.get("permissions");
            if (!permissions ||
                $.inArray("all", permissions) > -1 ||
                $.inArray(friend.get('id'), permissions) > -1
                ) {
                filteredPosts.push(_.omit(post.toJSON(), 'permissions'));
            }
        }, this);
        return filteredPosts;
    }
})

return Posts;
});
