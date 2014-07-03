define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.collectionView',
    'marionette',
    'msgpack',
    'app/encryption',
    'app/models/post',
    'app/models/friend',
    'app/collections/myPosts',
    'app/collections/posts',
    'app/collections/friends',
    'app/collections/profiles',
    'app/views/post',
    'app/views/friend',
    'app/views/modals',
    'app/storage',
    'utils/data-convert',
    'utils/image',
    'utils/random'
], function($, _, Backbone, CollectionView, Marionette, Msgpack, Encryption, Post, Friend, MyPosts, PostCollection, FriendCollection, ProfileCollection, PostView, FriendView, Modals, Storage, DataConvert, ImageUtil, RandomUtil){

    var myPosts = new MyPosts();
    var friends = new FriendCollection();
    var otherCollection = new PostCollection();
    var profiles = new ProfileCollection();

    var Friends = Marionette.CollectionView.extend({
        childView: FriendView
    });

    var Posts = Marionette.CollectionView.extend({
        childView: PostView
    });


    var AppView = Backbone.View.extend({

        initialize: function() {
            this.listenTo(profiles, 'sync', function() {myPosts.fetch()});
            this.listenTo(myPosts, 'sync', this.onProfileSync);

            this.listenTo(friends, 'add', this.addFriendsPosts);
            this.listenTo(myPosts, 'add', function(obo){console.log(obo)});

            profiles.fetch();
            friends.fetch();

            this.newPostText = $("#newPostText");
            this.newPostImage = $("#newPostImage");

            var friendsList = new Friends({
                collection: friends
            });

            friendsList.render();
            $("#friends").html(friendsList.el);


            var myPostList = new Posts({
                collection: otherCollection
            });

            myPostList.render();
            $("#friendsPosts").html(myPostList.el);
        },

        el: 'body',

        events: {
            'submit form': 'createPost',
            "click #addFriend": 'showAddFriendForm',
            "click #myInfo": 'showMyProfile'

        },

        // Wait for user profile to sync before displaying user posts
        // This is required for user name / image to show up properly in posts
        onProfileSync: function() {

            var profilePictureUrl = profiles.getFirst().get('pictureUrl');
            var profileName = profiles.getFirst().get('name');


            var update = {myPost: true, profilePictureUrl: profilePictureUrl, owner: profileName};

            myPosts.each(function(post) {
                var  p = new Post(_.extend(post.attributes, update));
                otherCollection.add(p);
            }, this);
/*
            var collectionView = new Backbone.CollectionView( {
                el : $( "ul#content" ),
                selectable : false,
                collection : myPosts,
                modelView : PostView,
                modelViewOptions: {myPost: true, profilePictureUrl: profilePictureUrl},
                emptyListCaption: "Empty!"
            } );

            collectionView.render();
*/
        },

        addFriendsPosts: function(friend) {

            //var view = new FriendView({ model: friend });
            // $('#friends').prepend( view.render().el );

            var friendManifest = friend.get('friendsManifest');
            if (!friendManifest) {
                return;
            }
            Storage.downloadUrl(friendManifest).done(function(data) {
                var decData = Encryption.decryptBinaryData(data, "global");
                var decObj = Msgpack.decode(decData.buffer);
                console.log(decObj);

                var posts = decObj['posts'];

                friend.set('pictureUrl', decObj['pictureUrl'] );
                friend.save();

                for (var i = 0; i < posts.length; i++) {
                    var post = posts[i];
                    post['myPost'] = false;
                    post['owner'] = decObj['name'];
                    post['profilePictureUrl'] = friend.get('pictureUrl');
                    var postModel = new Post(post);
                    otherCollection.add(postModel);
                }
            });

        },


        showAddFriendForm: function() {

            var app = this;
            Modals.addFriend().done(function(model) {
                app.createUser(model.get('account'), model.get('friendManifest'));
            });
        },

        showMyProfile: function() {
            var profile = profiles.getFirst();
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
            var changes = {account: account, manifestFile: id, friendsManifest: friendsManifest};

            var newFriend = new Friend(changes);
            this.saveManifest(newFriend)
                .then(Storage.shareDropbox)
                .then(function(url) {
                    newFriend.set('manifestUrl', url);
                    friends.add(newFriend);
                    newFriend.save();
                    deferred.resolve(newFriend);
                });
            return deferred;
        },

        saveManifest: function(friend) {
            var posts = myPosts.toJSON();
            var manifest = {};

            manifest['posts'] = myPosts.toJSON();

            var profile = profiles.getFirst();
            manifest['name'] = profile.get('name');
            manifest['pictureUrl'] = profile.get('pictureUrl');

            var packedManifest = new Uint8Array(Msgpack.encode(manifest));
            return friend.saveManifest(packedManifest);
        },
        saveManifests: function() {
            friends.each(function(friend) {
                this.saveManifest(friend);
            }, this);
        },

        createPost: function(event) {
            event.preventDefault();

            var post = new Post();
            var date = new Date().getTime();
            post.set({owner: "MEEEEEEEE", sharedDate: date, created: date});

            var postText = this.newPostText.val();
            if (postText && postText.length > 0) {
                post.set({hasText: true, textData: postText});
            }

            var imageElement = this.newPostImage.children()[0] ;
            if (imageElement) {
                var resizedData = ImageUtil.resize(imageElement, 400, 300);
                var fullsizeData = imageElement.src;
                post.set({hasImage: true, resizedImageData: resizedData, fullImageData: fullsizeData });
            }

            var appView = this;
            post.uploadPost().done(function() {
                var form = $("#newPostForm");
                form.trigger('reset');
                form.removeClass("in");
                myPosts.add(post);
                post.save();
                appView.saveManifests();

            });

            console.log("Clicked post " + event);
        }
    });

    return AppView;
});