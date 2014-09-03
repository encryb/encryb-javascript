define([
    'jquery',
    'underscore',
    'backbone',
    'jcrop',
    'jasny-bootstrap',
    'marionette',
    'visibility',
    'app/app',
    'app/models/post',
    'app/models/friend',
    'app/views/modals',
    'app/storage',
    'utils/data-convert',
    'utils/image',
    'utils/random',
    'require-text!app/templates/wall.html'
], function($, _, Backbone, Jcrop, Jasny, Marionette, Visibility, App, PostModel, FriendModel,
            Modals, Storage, DataConvert, ImageUtil, RandomUtil,
            WallTemplate
    ){

    var AppView = Marionette.LayoutView.extend({
        template: _.template( WallTemplate ),
        regions: {
            posts: "#posts",
            createPost: "#createPost",
            friends: "#friends"
        },

            /*
        initialize: function() {

            var minute = 60 * 1000;
            Visibility.every(3 * minute, 15 * minute, function () {
                var refresh = wall.state.refreshPosts.bind(app);
                refresh();
            });

            Visibility.change(function (e, state) {
                if (state == "visible") {
                    var refresh = wall.refreshPosts.bind(app);
                    refresh();
                }
            })
        },

             */
        events: {
            "click #addFriend": 'showAddFriendForm',
            "click #myInfo": 'showMyProfile',
            "change.bs.fileinput #profileFile": "pictureChange",
            "click #profileFile #cancelButton": "cancelButton",
            "click #profileFile #applyButton": "applyButton"

        },

        cancelButton: function() {
            event.preventDefault();
            $("#profileFile").fileinput("reset");
        },
        applyButton: function(event) {
            event.preventDefault();
            var select = this.jcrop_profile.tellSelect();
            var image = $("#profilePicture img")[0];

            var resized = ImageUtil.cropAndResize(image, 360, 300, select.x, select.y, select.w, select.h);
            $("#bob").attr('src', resized);
            $("#profileFile").fileinput("reset");
        },
        pictureChange: function(){
            var wall = this;
            var image = $("#profilePicture img");
            var size = ImageUtil.getNaturalSize(image);
            image.Jcrop({
                aspectRatio: 1.2,
                setSelect: [0, 0, 360, 300],
                trueSize: [size.width, size.height]
            },function(){
                wall.jcrop_profile = this;
            });
        },

        showAddFriendForm: function() {

            var app = this;
            Modals.addFriend().done(function(model) {
                app.createUser(model.get('account'), model.get('friendManifest'));
            });
        },

        showMyProfile: function() {
            var profile = App.state.myProfiles.getFirst();
            var changes = {};

            var modal = Modals.showMyProfile(profile, changes);

            modal.on('ok', function() {
                if ('name' in changes) {
                    profile.set('name', changes['name']);
                    profile.save();
                }
                if('picture' in changes) {

                    var img = new Image();
                    img.src = changes['picture'];

                    var resized = ImageUtil.resize(img, 300, 200);

                    var picture = DataConvert.dataUriToTypedArray(resized);
                    Storage.uploadDropbox("profilePic",  picture['data']).then(Storage.shareDropbox).done(function(url) {
                        profile.set('pictureFile', "profilePic");
                        profile.set('pictureUrl', url);
                        profile.save();
                    });
                }
            });
        },

        createUser: function(account, friendsManifest) {

            var deferred = $.Deferred();

            var id = RandomUtil.makeId();
            var attrs = {account: account, manifestFile: id, friendsManifest: friendsManifest};

            var newFriend = new FriendModel(attrs);
            this.state.saveManifest(newFriend)
                .then(Storage.shareDropbox)
                .then(function(url) {
                    newFriend.set('manifestUrl', url);
                    App.state.myFriends.add(newFriend);
                    newFriend.save();
                    deferred.resolve(newFriend);
                });
            return deferred;
        },

        deleteCallback: function (model) {
            console.log("Deleting " + model);
            this.state.saveManifests();
        }
    });

    return AppView;
});