define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'app/views/comment',
    'app/views/modals',
    'require-text!app/templates/post.html'

], function($, _, Backbone, Marionette, CommentView, Modals, PostTemplate){

    var PostView = Marionette.ItemView.extend({

        template: _.template( PostTemplate ),

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

        /*
        childView: CommentView,
        childViewContainer: "#comments",
*/
        /*
        serializeModel: function(model){
            var attr = _.clone(model.attributes);
            if('profilePictureUrl' in this.options) {
                attr['profilePictureUrl'] = this.options['profilePictureUrl'];
            }
            if ('myPost' in this.options) {
                attr['myPost'] = this.options['myPost'];
            }
            return attr;
        },*/

        'modelEvents': {
            'change': 'render'
        },

        events: {
            "click #resizedImage": "showImage",
            "click #deletePost": "deletePost"
            /*
            "click #likeButton": "toggleLike"
            */
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