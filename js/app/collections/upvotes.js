define([
  'backbone',
  'utils/dropbox-client'
], function(Backbone){

var Upvotes = Backbone.Collection.extend({

    model: Backbone.Model,

    dropboxDatastore: new Backbone.DropboxDatastore('Upvotes_1'),

    initialize: function () {
        this.fetch();
        this.dropboxDatastore.syncCollection(this);
    },

    addUpvote: function (postId) {
        this.create({postId: postId});
    },
    removeUpvote: function (postId) {
        var upvote = this.findWhere({postId: postId});
        if (upvote) {
            upvote.destroy();
        }
    },
    isUpvoted: function (postId) {
        var upvote = this.findWhere({postId: postId});
        if (upvote) {
            return true;
        }
        return false;


    }
});

return Upvotes;
});
