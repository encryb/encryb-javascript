define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'app/views/modals',
    'require-text!app/templates/postContent.html'

], function($, _, Backbone, Marionette, Modals, PostContentTemplate){

    var PostView = Marionette.ItemView.extend({

        template: _.template( PostContentTemplate ),

        initialize: function() {
            this.model.fetchPost(false);
            /*
            var comment = new Backbone.Model({owner:"Ogi", created: 0, textData: "This is just a test"});
            var comment2 = new Backbone.Model({owner:'Ogi2', created:100000, textData: "This is more than just a test"});
            this.collection = new Backbone.Collection();
            this.collection.add(comment);
            this.collection.add(comment2);
            */
        },

        'modelEvents': {
            'change': 'render'
        },

        events: {
            "click #resizedImage": "showImage",
            "click #deletePost": "deletePost"
        },

        showImage: function(){
            Modals.showImage(this.model);
        },

        deletePost: function() {
            this.trigger("post:delete");
            this.model.deletePost();
        }
    });
    return PostView;
});