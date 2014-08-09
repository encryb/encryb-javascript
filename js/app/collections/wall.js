define([
  'backbone',
  'underscore',
  'app/models/post',
  'app/models/postWrapper',
  'app/remoteManifest',
  'utils/dropbox-client'
], function(Backbone, _, Post, PostWrapper, RemoteManifest, DropboxClient){

var Wall2 = Backbone.Collection.extend({
    model: PostWrapper,

    collections: {},
    upvotes: {},
    friends: {},

    idToModel: {},

    initialize: function() {
        this.on("add", this.onPostAdded);
        this.on("remove", this.onPostRemoved);
    },

    onPostAdded: function(model) {
        var id = model.get('postId');
        this.idToModel[id] = model;

        if (this.myUpvotes.findWhere({postId:id})) {
            model.addMyUpvote();
        }
    },

    onPostRemoved: function(model) {
        delete this.idToModel[model.get('postId')];
    },

    onMyUpvoteAdded: function(upvote) {
        var upvoteId = upvote.get('postId');
        var model = this.idToModel[upvoteId];
        if(model) {
            model.addMyUpvote();
        }
    },

    onFriendUpvoteAdded: function(upvoteId, name, pictureUrl, userId) {
        console.log("onFriendUpvoteAdded", upvoteId, name);
        if (this.idToModel.hasOwnProperty(upvoteId)) {
            var model = this.idToModel[upvoteId];
            if(model) {
                model.addFriendUpvote(name, pictureUrl, userId);
            }
        }
    },

    onMyUpvoteRemoved: function(upvote) {
        var upvoteId = upvote.get('postId');
        var model = this.idToModel[upvoteId];
        if(model) {
            model.removeMyUpvote();
        }
    },

    onFriendUpvoteRemoved: function(upvoteId, friend) {
        if (this.idToModel.hasOwnProperty(upvoteId)) {
            var model = this.idToModel[upvoteId];
            if(model) {
                model.removeFriendUpvote(friend);
            }
        }
    },

    toggleUpvote: function(id) {
        if (! this.myUpvotes) {
            return;
        }
        if (this.myUpvotes.isUpvoted(id)) {
            this.myUpvotes.removeUpvote(id);
        }
        else {
            this.myUpvotes.addUpvote(id);
        }
    },

    addMyUpvotes: function(myUpvotes) {
        this.myUpvotes = myUpvotes;
        this.listenTo(myUpvotes, 'add', this.onMyUpvoteAdded);
        this.listenTo(myUpvotes, 'remove', this.onMyUpvoteRemoved);

        myUpvotes.each(function(upvote) {
            this.onUpvoteAdded(upvote);
       });
    },

    addUpvote: function(postId, friend) {
        var upvotes;
        if (this.upvotes.hasOwnProperty(postId)) {
            upvotes = this.upvotes[postId];
        }
        else {
            upvotes = [];
            this.upvotes['postId'] = upvotes;
        }
        upvotes.push(friend);
    },

    removeMyUpvote: function(postId, friend) {
        var postId = upvote.get('postId');
        var upvotes = this.upvotes[postId];
        var index = upvotes.indexOf(postId);
        upvotes.splice(index, 1);
    },

    addMyCollection: function(posts, name, pictureUrl) {

        this.listenTo(posts, 'add', this.addMyPost);
        // remove is handled automatically when model is destoyed
        this.myName = name;
        this.myPicture = pictureUrl;
        var wall2 = this;
        posts.each(function(post) {
            var wrapper = new PostWrapper();
            wrapper.setMyPost(post, name, pictureUrl);
            wall2.add(wrapper);
        });
    },

    addMyPost: function(post) {
        var wrapper = new PostWrapper();
        wrapper.setMyPost(post, this.myName, this.myPicture);
        this.add(wrapper);
    },

    addCollection: function(manifest, friend) {

        var wall2  = this;

        var userId = "undefined";
        if (friend.hasOwnProperty('userId')) {
            userId = friend.userId;
        }

        if (this.friends.hasOwnProperty(manifest)) {
            var oldFriend = this.friends[manifest];

            RemoteManifest.compare(oldFriend, friend, function(key, action, item) {
                if (key == "posts") {
                    if (action == "add") {
                        wall2.addPost(item, friend.name, friend.pictureUrl, userId);
                    }
                    else {
                        wall2.removePost(item);
                    }
                }
                else if (key == "upvotes"){
                    if (action == "add") {
                        wall2.onFriendUpvoteAdded(item.postId, friend.name, friend.pictureUrl, userId);
                    }
                    else {
                        wall2.onFriendUpvoteRemoved(item.postId, userId);
                    }
                }
            });
        }
        else {
            this.friends[manifest] = friend;
            for (var i=0; i< friend.posts.length; i++) {
                var post = friend.posts[i];
                wall2.addPost(post, friend.name, friend.pictureUrl, userId);
            }
            if (friend.hasOwnProperty('upvotes')) {
                for (var i=0; i< friend.upvotes.length; i++) {
                    var upvote = friend.upvotes[i];
                    wall2.onFriendUpvoteAdded(upvote.postId, friend.name, friend.pictureUrl, userId);
                }
            }
        }
    },
    addPost: function(post, name, pictureUrl, userId) {
        var model = {post: post, owner: name, profilePictureUrl: this.myPicture, model: post};

        var wrapper = new PostWrapper();
        wrapper.setFriendsPost(post, name, pictureUrl, userId);
        this.add(wrapper);

    },
    removePost: function(post) {
        var removePost = this.findWhere({id: post.id});
        if (removePost) {
            this.remove(removePost);
        }
    },
    setPostModel: function(post) {
        this.postModel = post;
    },
    destroyPost: function() {
        if ('postModel' in this) {
            this.postModel.destroyPost();
        }
        this.destroy();
    },
    comparator: function(post) {
        return -post.get('created');
    }

})

return Wall2;
});