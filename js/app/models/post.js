define([
    'backbone',
    'underscore'
], function (Backbone, _) {

    var Post = Backbone.Model.extend({

        defaults: {
            // persisted
            created: null,
            password: null,
            hasText: false,
            hasImage: false


            // no defaults
            // folderId
            // textUrl
            // resizedImageUrl
            // imageUrl

            // not persisted
            //resizedImageData: null,
            //fullImageData: null,
            //textData: null
        },

        nonPersistent: [ "resizedImageData", "fullImageData", "textData"],

        // Return a copy of the model's `attributes` object.
        toJSON: function(options) {
            if (options && options.full) {
                return _.clone(this.attributes);
            }
            else {
                return _.omit(this.attributes, this.nonPersistent);
            }
        }
    });
    return Post;
});
