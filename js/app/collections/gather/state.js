define([
    'backbone',
    'marionette',
    'underscore',
    'app/models/postWrapper',
    'app/remoteManifest',
    'utils/dropbox-client'
], function(Backbone, Marionette, _, PostWrapper, RemoteManifest, DropboxClient) {
    var State = Marionette.Object.extend({

        initialize: function(options) {
            this.friends = {};

            this.myId = Backbone.DropboxDatastore.client.dropboxUid();

            this.posts = new Backbone.Collection();
            this.posts.comparator = function(post) {
                return -post.get('post').get('created');
            };
            this.comments = new Backbone.Collection();
            this.listenTo(this.comments, "add", this.dispatchCommentAdd);
            this.listenTo(this.comments, "remove", this.dispatchCommentRemove);
            this.upvotes = new Backbone.Collection();
            this.listenTo(this.upvotes, "add", this.dispatchUpvoteAdd);
            this.listenTo(this.upvotes, "remove", this.dispatchUpvoteRemove);

            this.myPosts = options.posts;
            this.myComments = options.comments;
            this.myUpvotes = options.upvotes;

            this.myPosts.on("add", this.onMyPostAdded.bind(this));
            this.myPosts.on("removed", this.onMyPostRemoved.bind(this));

            this.myComments.on("add", this.onMyCommentAdded.bind(this));
            this.myComments.on("removed", this.onMyCommentRemoved.bind(this));

            this.myUpvotes.on("add", this.onMyUpvoteAdded.bind(this));
            this.myUpvotes.on("removed", this.onMyUpvoteRemoved.bind(this));

            this.name = options.name;
            this.profilePictureUrl = options.pictureUrl;

        },

        onMyPostAdded: function(post) {
            var wrapper = new PostWrapper();
            wrapper.setMyPost(post, this.name, this.profilePictureUrl);
            this.posts.add(wrapper);
            var postComments = this.comments.where({postId: wrapper.get("postId")});
            for (var i=0; i<postComments.length; i++) {
                var comment = postComments[i];
                wrapper.addComment(comment.get("id"), comment.get("owner") , comment.get("text"), comment.get("date"));
            }
            var postUpvotes = this.upvotes.where({postId: wrapper.get("postId")});
            for (var i=0; i<postUpvotes.length; i++) {
                var upvote = postUpvotes[i];
                wrapper.addUpvote(upvote.get("id"), upvote.get("owner") , upvote.get("text"), upvote.get("date"));
            }
        },
        onMyPostRemoved: function(post) {
            var postId = this.myId + ":" + post.get("id");
            var model = this.posts.findWhere({postId: postId});
            model.destroy();
        },
        onMyCommentAdded: function(comment) {
            var attr = _.extend(_.clone(comment.attributes), {owenerId: this.myId, owner: this.name, myComment: true});
            var model = new Backbone.Model(attr);
            this.comments.add(model);
        },
        onMyCommentRemoved: function(comment) {
            var model = this.comments.findWhere({id: comment.get("id"), owenerId: this.myId});
            model.destroy();
        },
        onMyUpvoteAdded: function(upvote) {
            var attr = _.extend(_.clone(upvote.attributes), {owenerId: this.myId, myUpvote: true});
            var model = new Backbone.Model(attr);
            this.upvotes.add(model);
        },
        onMyUpvoteRemoved: function(upvote) {
            var model = this.upvotes.findWhere({id: upvote.get("id"), owenerId: this.myId});
            model.destroy();
        },

        addCollection: function(manifest, friend) {
            var state  = this;

            if (!friend.hasOwnProperty('userId')) {
                return;
            }

            if (this.friends.hasOwnProperty(manifest)) {
                var oldFriend = this.friends[manifest];

                RemoteManifest.compare(oldFriend, friend, function(key, action, item) {
                    if (key == "posts") {
                        if (action == "add") {
                            state.addFriendsPost(item, friend);
                        }
                        else {
                            state.removeFriendsPost(item, friend);
                        }
                    }
                    else if (key == "upvotes"){
                        if (action == "add") {
                            state.addFriendsUpvote(item, friend);
                        }
                        else {
                            state.removeFriendsUpvote(item, friend);
                        }
                    }
                    else if (key == "comments") {
                        if (action == "add") {
                            state.addFriendsComment(item, friend);
                        }
                        else {
                            state.removeFriendsComment(item, friend);
                        }
                    }
                });
            }
            else {
                this.friends[manifest] = friend;
                for (var i=0; i< friend.posts.length; i++) {
                    var post = friend.posts[i];
                    state.addFriendsPost(post, friend);
                }
                if (friend.hasOwnProperty('upvotes')) {
                    for (var i=0; i< friend.upvotes.length; i++) {
                        var upvote = friend.upvotes[i];
                        state.addFriendsUpvote(upvote, friend);
                    }
                }
                if (friend.hasOwnProperty('comments')) {
                    for (var i=0; i< friend.comments.length; i++) {
                        var comment = friend.comments[i];
                        state.addFriendsComment(comment, friend);
                    }
                }

            }
        },

        addFriendsPost: function(post, friend) {
            var wrapper = new PostWrapper();
            wrapper.setFriendsPost(post, friend['name'], friend['pictureUrl'], friend['userId']);
            this.posts.add(wrapper);
            var postComments = this.comments.where({postId: wrapper.get("postId")});
            for (var i=0; i<postComments.length; i++) {
                var comment = postComments[i];
                wrapper.addComment(comment.get("id"), comment.get("owner") , comment.get("text"), comment.get("date"));
            }
        },
        removeFriendsPost: function(post, friend) {
            var postId = friend['userId'] + ":" + post.id;
            var model = this.posts.findWhere({postId: postId});
            model.destroy();
        },
        addFriendsComment: function(comment, friend) {
            var attr = _.extend(_.clone(comment), {owenerId: friend['userId'], owner: friend['name']});
            var model = new Backbone.Model(attr);
            this.comments.add(model);
        },
        removeFriendsComment: function(comment, friend) {
            var model = this.comments.findWhere({id: comment.id, owenerId: friend['userId']});
            model.destroy();
        },

        addFriendsUpvote: function(upvote, friend) {
            var attr = _.extend(_.clone(upvote), {owenerId: friend['userId'], owner: friend['name'], profilePictureUrl: friend['pictureUrl']});
            var model = new Backbone.Model(attr);
            this.upvotes.add(model);
        },
        removeFriendsUpvote: function(post, friend) {
            var model = this.upvotes.findWhere({id: post.id, owenerId: friend['userId']});
            model.destroy();
        },

        dispatchCommentAdd: function(comment) {
            var postId = comment.get("postId");
            var model = this.posts.findWhere({postId: postId});
            // we might not have this post yet.
            if (!model) {
                return;
            }
            model.addComment(comment.get("id"), comment.get("owner") , comment.get("text"), comment.get("date"));
        },
        dispatchCommentRemove: function(comment) {
            var postId = comment.get("postId");
            var model = this.posts.findWhere({postId: postId});
            // post might have been removed.
            if (!model) {
                return;
            }
            model.removeComment(comment.get("id"));
        },
        dispatchUpvoteAdd: function(upvote) {
            var postId = upvote.get("postId");
            var model = this.posts.findWhere({postId: postId});
            // we might not have this post yet.
            if (!model) {
                return;
            }
            if (upvote.get("myUpvote")) {
                model.addMyUpvote();
            }
            else {
                model.addFriendsUpvote(upvote.get('name'), upvote.get('profilePictureUrl'), upvote.get('userId'));
            }
        },
        dispatchUpvoteRemove: function(upvote) {
            var postId = upvote.get("postId");
            var model = this.posts.findWhere({postId: postId});
            // post might have been removed.
            if (!model) {
                return;
            }
            if (upvote.get("myUpvote")) {
                model.removeMyUpvote();
            }
            else {
                model.removeFriendsUpvote(upvote.get('userId'));
            }
        }

    });
    return State;
});
