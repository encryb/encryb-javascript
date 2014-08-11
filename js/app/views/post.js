define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'app/views/comments',
    'app/views/postContent',
    'app/views/upvotes',
    'require-text!app/templates/post.html'

], function($, _, Backbone, Marionette, CommentsView, PostContentView, UpvotesView, PostTemplate) {
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

            var upvotesModel = this.model.get("upvotes");
            var upvotesView = new UpvotesView({model: upvotesModel, collection: upvotesModel.get("friendUpvotes")});
            this.upvotes.show(upvotesView);

            var commentsColl = this.model.get("comments");
            var commentsView = new CommentsView({collection: commentsColl});
            this.comments.show(commentsView);

            var postView = this;
            commentsView.on("comment:submit", function(attr) {
                postView.submitComment(attr);
            })
        },
        events: {
            "click #upvoteButton": "toggleUpvote"
        },
        toggleUpvote: function() {
            var id = this.model.get("postId");
            this.trigger("post:like", id);
        },
        submitComment: function(attr) {
            var id = this.model.get("postId");
            attr['postId'] = id;
            this.trigger("comment:submit", attr);

        }

    });
    return PostView;
});