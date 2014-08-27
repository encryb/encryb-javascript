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
    'app/encryption',
    'app/storage',
    'utils/dropbox-client'
    ],
function (Backbone, Marionette, App, State, PermissionColl,
          WallView, CreatePostView, PostsView, FriendsView, SetupView,
          Encryption, Storage, DropboxClient) {


    function downloadURI(uri, name) {
        var link = document.createElement("a");
        link.download = name;
        link.href = uri;
        link.click();
    }


    var WallController = Marionette.Controller.extend({

        showWall: function () {

            var keysLoaded = (Encryption.getKeys() != null);
            var dropboxAuthenticated = DropboxClient.isAuthenticated();

            if (!keysLoaded || !dropboxAuthenticated) {
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

            var keysLoaded = (Encryption.getKeys() != null);
            model.set("dropboxEnabled", DropboxClient.isAuthenticated());
            model.set("keysLoaded", keysLoaded);

            var setupView = new SetupView({model: model});
            App.main.show(setupView);

            setupView.on("dropbox:login", function () {
                DropboxClient.authenticate({}, function (error, client) {
                    if (error) {
                        console.log("Dropbox Authentication Error", error);
                    }
                    else {
                        model.set("dropboxEnabled", true);
                    }
                });

            });
            setupView.on("dropbox:logout", function () {
                DropboxClient.signOut({}, function () {
                    window.location.href = "https://www.dropbox.com/logout";
                    model.set("dropboxEnabled", false);
                })
            });

            setupView.on("keys:create", function () {
                Encryption.createKeys();
                model.set("keysLoaded", true);
            });
            setupView.on("keys:remove", function () {
                Encryption.removeKeys();
                model.set("keysLoaded", false);
            });
            setupView.on("keys:download", function () {
                var keys = Encryption.getEncodedKeys();
                var uri = "data:text/javascript;base64," + window.btoa(JSON.stringify(keys));
                downloadURI(uri, "encryb.keys");
            });
            setupView.on("keys:upload", function (keysString) {
                var keys = JSON.parse(keysString);
                Encryption.saveKeys(keys['secretKey'], keys['publicKey']);
                model.set("keysLoaded", true);
            });
            setupView.on("keys:saveToDropbox", function() {
                var keys = Encryption.getEncodedKeys();
                Storage.uploadDropbox("encryb.keys", JSON.stringify(keys));
            });

            setupView.on("continue", function() {
                App.appRouter.navigate("", {trigger: true});
            });
        }
    });

    return WallController;
});
