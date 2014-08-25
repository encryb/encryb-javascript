define([
    'backbone',
    'marionette',
    'app/app',
    'app/collections/gather/state',
    'app/collections/permissions',
    'app/views/wall',
    'app/views/createPost',
    'app/views/posts',
    'app/views/friend',
    'app/views/setup'
],
function (Backbone, Marionette, App, State, PermissionColl, WallView, CreatePostView, PostsView, FriendsView, SetupView) {


    var WallController = Marionette.Controller.extend({

        showWall: function () {

            if (1 == 1) {
                Backbone.history.navigate("settings");
                return;
            }

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

        },

        settings: function() {
            var setupView = new SetupView();
            App.main.show(setupView);
        }
    });

    return WallController;
});
