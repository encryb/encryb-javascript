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
    'app/views/setup',
    'utils/dropbox-client'
],
function (Backbone, Marionette, App, State, PermissionColl, WallView, CreatePostView, PostsView, FriendsView, SetupView, DropboxClient) {


    var WallController = Marionette.Controller.extend({

        showWall: function () {

            if (1 != 1) {
                App.appRouter.navigate("settings", {trigger: true});
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
            var model = new Backbone.Model();
            model.set("dropboxEnabled", DropboxClient.isAuthenticated());
            model.set("keysLoaded", true);
            var setupView = new SetupView({model:model});
            App.main.show(setupView);

            setupView.on("dropbox:login", function() {
                DropboxClient.authenticate({}, function(error, client) {
                   if (error) {
                       console.log("Dropbox Authentication Error", error);
                   }
                   else {
                       model.set("dropboxEnabled", true);
                   }
                });

            });
            setupView.on("dropbox:logout", function() {
                DropboxClient.signOut({}, function(){
                    window.location.href = "https://www.dropbox.com/logout";
                    model.set("dropboxEnabled", false);
                })
            });
        }
    });

    return WallController;
});
