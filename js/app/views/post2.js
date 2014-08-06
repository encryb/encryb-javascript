define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'app/views/post',
    'app/views/upvotes',
    'require-text!app/templates/post2.html'

], function($, _, Backbone, Marionette, PostView, UpvotesView, PostTemplate) {
    var PostView2 = Marionette.LayoutView.extend({
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
            var postContentView = new PostView({model: this.model.get('post')});
            this.content.show(postContentView);
            var upvotesModel = this.model.get('upvotes');
            var upvotesView = new UpvotesView({model: upvotesModel, collection: upvotesModel.others});
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
    return PostView2;
});