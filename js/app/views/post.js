define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'app/views/postContent',
    'app/views/upvotes',
    'require-text!app/templates/post.html'

], function($, _, Backbone, Marionette, PostContentView, UpvotesView, PostTemplate) {
    var PostView = Marionette.LayoutView.extend({
        template: _.template(PostTemplate),
        regions: {
            content: "#postContent",
            upvotes: "#upvotes",
            comments: "#comments"
        },
        onRender: function () {
            this.setupChildren();
        },
        setupChildren: function () {
            var postContentView = new PostContentView({model: this.model.get('post')});
            this.content.show(postContentView);
            var upvotesModel = this.model.get('upvotes');
            var upvotesView = new UpvotesView({model: upvotesModel, collection: upvotesModel.get("friendUpvotes")});
            this.upvotes.show(upvotesView);
        },
        events: {
            "click #upvoteButton": "toggleUpvote"
        },
        toggleUpvote: function() {
            var id = this.model.get("postId");
            this.trigger("post:like", id);
        }
    });
    return PostView;
});