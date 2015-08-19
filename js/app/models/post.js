define([
    'backbone',
    'underscore'
], function (Backbone, _) {

    var Post = Backbone.Model.extend({

        toJSON: function() {
            // exclude content, we need to convert it first
            var exclude = ["content"];
            // we uploaded text to a file, do not store it in datastore as well
            if (this.has("textUrl")) {
                exclude.push("text");
            }
            var json = _.omit(this.attributes, exclude);

            if (this.attributes.hasOwnProperty("content")) {
                json["content"] = JSON.stringify(this.attributes["content"]);
            }

            return json;
        },
        
        parse: function(response, options) {
            if (response.hasOwnProperty("content")) {
                try {
                    response["content"] = JSON.parse(response["content"]);
                }
                catch (e) {
                    console.error("Could not parse content", e.message, response.content);
                }
            }
            return response;
        }
    });
    return Post;
});
