define([
    'backbone',
    'underscore'
], function (Backbone, _) {

    var Post = Backbone.Model.extend({

        constructor: function() {
            Backbone.Model.apply(this, arguments);
        },

        nonPersistent: [ "resizedImageData", "fullImageData", "textData"],

        // Return a copy of the model's `attributes` object.
        toJSON: function() {

            var json = _.omit(this.attributes, ["content"]);

            // toJSON gets called by two different things,
            // so we return json in 2 different ways
            if (!this.attributes.hasOwnProperty("content")) {
                return json;
            }

            var contentCollection = this.attributes["content"];
            var content = contentCollection.models;
            // no additional content
            if (content.length == 0) {
                return json;
            }
            json['content'] = [];
            for (var i=0; i<content.length; i++) {
                var contentAttributes = _.omit(content[i].toJSON(), this.nonPersistent);
                json['content'].push(JSON.stringify(contentAttributes));
            }
            return json;
        },

        parse: function(resp) {

            if (!resp.hasOwnProperty("content")) {
                return resp;
            }

            var result = _.omit(resp, ["content"]);
            var content = resp["content"];
            result["content"] = new Backbone.Collection();
            for (var i=0; i<content.length; i++) {
                var contentAttributes = JSON.parse(content[i]);
                var model = new Backbone.Model(contentAttributes);
                result["content"].add(model);
            }

            return result;
        }
    });
    return Post;
});
