define([
  'backbone',
  'app/collections/encryptedDatastore'
], function(Backbone, EncryptedDatastore){

var Comments = Backbone.Collection.extend({

    model: Backbone.Model,

    dropboxDatastore: new EncryptedDatastore('Comments_3'),

    initialize: function () {
        this.dropboxDatastore.syncCollection(this);
    }
});

return Comments;
});
