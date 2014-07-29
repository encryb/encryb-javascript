define([
  'backbone',
  'app/collections/upvotes',
  'app/models/post',
  'app/models/postWrapper'
], function(Backbone, Upvotes, Post, PostWrapper){

var Wall2 = Backbone.Collection.extend({
    model: PostWrapper,

    collections: {},

    myName : "",

    myPicture: "",

    upvotes: new Upvotes(),

    myUserId: Backbone.DropboxDatastore.client.dropboxUid(),

    idToModel: {},

    initialize: function() {
        this.on("add", this.onPostAdded);
        this.on("remove", this.onPostRemoved);

        this.listenTo(this.upvotes, "add", this.onUpvoteAdded);
        this.listenTo(this.upvotes, "remove", this.onUpvoteRemoved);


    },

    onPostAdded: function(model) {
        var id = model.getPostId();
        this.idToModel[id] = model;

        if (this.upvotes.findWhere({postId:id})) {
            model.set('liked', true);
        }
    },

    onPostRemoved: function(model) {
        delete this.idToModel[model.getPostId()];
    },

    onUpvoteAdded: function(upvote) {
        var upvoteId = upvote.get('postId');
        if (this.idToModel.hasOwnProperty(upvoteId)) {
            var model = this.idToModel[upvoteId];
            model.set('liked', true);
        }
    },

    onUpvoteRemoved: function(upvote) {
        var upvoteId = upvote.get('postId');
        if (this.idToModel.hasOwnProperty(upvoteId)) {
            var model = this.idToModel[upvoteId];
            model.set('liked', false);
        }
    },

    toggleUpvote: function(id) {
        if (this.upvotes.isUpvoted(id)) {
            this.upvotes.removeUpvote(id);
        }
        else {
            this.upvotes.addUpvote(id);
        }
    },

    addMyCollection: function(posts, name, pictureUrl) {
        this.collections['mine'] = posts;
        this.listenTo(posts, 'add', this.addMyPost);
        this.myName = name;
        this.myPicture = pictureUrl;
        var wall2 = this;
        posts.each(function(post) {
            var wrapper = new PostWrapper(post.attributes);
            wrapper.setPostModel(post);
            wrapper.set('myPost', true);
            wrapper.set('owner', name);
            wrapper.set('profilePictureUrl', pictureUrl);
            wrapper.set('userId', wall2.myUserId);
            wrapper.set('liked', false);
            wall2.add(wrapper);
        });
    },

    addMyPost: function(post) {
        var wrapper = new PostWrapper(post.attributes);
        wrapper.setPostModel(post);
        wrapper.set('myPost', true);
        wrapper.set('owner', this.myName);
        wrapper.set('profilePictureUrl', this.myPicture);
        wrapper.set('userId', this.myUserId);
        wrapper.set('liked', false);
        this.add(wrapper);
    },

    addCollection: function(manifest, posts, name, pictureUrl, userId) {
        if (this.collections.hasOwnProperty(manifest)) {
            var remove = this.collections[manifest].slice(0);
            var add = [];
            for (var i=0; i < posts.length; i++) {
                var post = posts[i];
                var oldIndexId = remove.indexOf(post.id);
                // new post
                if (oldIndexId == -1) {
                    add.push(post);
                }
                // existing post
                else {
                    remove.splice(oldIndexId, 1);
                }
            }
        }
        else {
            var add = posts;
            var remove =[];
            this.collections[manifest] = [];
        }

        for (var i = 0; i < add.length; i++) {
            var post = add[i];
            var wrapper = new PostWrapper(post);
            wrapper.set('myPost', false);
            wrapper.set('owner', name);
            wrapper.set('profilePictureUrl', pictureUrl);
            wrapper.set('userId', userId);
            wrapper.set('liked', false);
            this.add(wrapper);
            this.collections[manifest].push(post.id);
        }
        for (var i = 0; i < remove.length; i++) {
            var post = remove[i];
            var removePost = this.findWhere({id: post});
            if (removePost) {
                this.remove(removePost);
            }
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
