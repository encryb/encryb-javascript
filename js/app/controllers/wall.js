define([
    'backbone',
    'marionette',
    'app/app',
    'app/collections/gather/state',
    'app/collections/permissions',
    'app/views/wall',
    'app/views/createPost',
    'app/views/post',
    'app/views/friend'
],
function (Backbone, Marionette, App, State, PermissionColl, WallView, CreatePostView, PostView, FriendView) {

    var PostsView = Marionette.CollectionView.extend({
        childView: PostView,
        initialize: function() {
            this.on("childview:post:delete", function(post){
                setTimeout(function(){App.state.saveManifests()}, 100);
            });

            this.on("childview:post:like", function(postView, id){
                App.state.myUpvotes.toggleUpvote(id);
                App.state.saveManifests();
            });

            this.on("childview:comment:submit", function(postView, comment) {
                App.state.myComments.addComment(comment['postId'], comment['text'], comment['date']);
                App.state.saveManifests();
            });

            this.on("childview:comment:delete", function(postView, commentId) {
                var comment = App.state.myComments.findWhere({id:commentId});
                if (comment) {
                    comment.destroy();
                    setTimeout(function(){App.state.saveManifests()}, 100);
                }
            });
        }
    });

    var FriendsView = Marionette.CollectionView.extend({
        childView: FriendView
    });

    var WallController = Marionette.Controller.extend({
        showWall: function () {

            App.state = new State();

            var wall = new WallView();
            App.main.show(wall);

            var postsView = new PostsView({
                collection: App.state.posts
            });
            wall.posts.show(postsView);

            var perms = new PermissionColl();
            perms.addFriends(App.state.myFriends);
            var createPostView = new CreatePostView({
                permissions: perms
            });
            wall.createPost.show(createPostView);

            var friendsView = new FriendsView({
                collection: App.state.myFriends
            });
            wall.friends.show(friendsView);

        }
    });

    return WallController;
});
