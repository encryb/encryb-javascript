define([
  'backbone',
  'app/models/post',
  'app/models/postWrapper'
], function(Backbone, Post, PostWrapper){

var Wall2 = Backbone.Collection.extend({
    model: PostWrapper,

    collections: {},

    myName : "",

    myPicture: "",

    addMyCollection: function(posts, name, pictureUrl) {
        console.log("addMyCollection");
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
            wall2.add(wrapper);
        });
    },

    addMyPost: function(post) {
        console.log("addMyPost");
        var wrapper = new PostWrapper(post.attributes);
        wrapper.setPostModel(post);
        wrapper.set('myPost', true);
        wrapper.set('owner', this.myName);
        wrapper.set('profilePictureUrl', this.myPicture);
        this.add(wrapper);
    },

    addCollection: function(manifest, posts, name, pictureUrl) {
        this.collections['manifest'] = posts;
        for (var i = 0; i < posts.length; i++) {
            var post = posts[i];
            var wrapper = new PostWrapper(post);
            wrapper.set('myPost', false);
            wrapper.set('owner', name);
            wrapper.set('profilePictureUrl', pictureUrl);
            this.add(wrapper);
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
