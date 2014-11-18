define([
    'jquery',
    'underscore',
    'backbone',
    'bootbox',
    'dropzone',
    'jasny-bootstrap',
    'marionette',
    'selectize',
    'app/app',
    'app/models/post',
    'utils/image',
    'require-text!app/templates/createPost.html'

], function($, _, Backbone, Bootbox, Dropzone, JasnyBootsrap, Marionette, Selectize, App, Post, ImageUtil, CreatePostTemplate){

    var NewPostView = Marionette.CompositeView.extend({
        template: _.template( CreatePostTemplate ),

        initialize: function() {
            this.listenTo(this.options.permissions, "add", this.permissionAdded);
            this.listenTo(this.options.permissions, "remove", this.permissionRemoved);

        },

        ui: {
            postSubmitButton: '#postSubmitButton',
            newPostTrigger: '#newPostTrigger',
            newPostText: '#newPostText',
            newPostImage: '#newPostImage',
            newPostForm: '#newPostForm',
            newPostDiv: '#newPostDiv',
            permissions: "#permissions",
            loadingImage: ".loading-img",
            dropzone: ".dropzone"
        },

        events: {
            'submit form': 'createPost',
            'focus @ui.newPostTrigger' : "expendForm"
        },

        onRender: function(){

            this.setupPermissionTags();

            this.setupFileDropzone();
        },

        permissionAdded: function(permission) {
            var selectize = this.ui.permissions[0].selectize;
            selectize.addOption(permission.toJSON());
            selectize.refreshOptions(true);
        },


        // $TODO: figure out why removal doesn't work
        permissionRemoved: function(permission) {
            var selectize = this.ui.permissions[0].selectize;
            selectize.removeOption(permission.toJSON());
            selectize.refreshOptions(true);
        },


        // $TODO: this should be moved outside of the view
        createPost: function(event) {
            event.preventDefault();

            var createPostView = this;

            this.ui.postSubmitButton.addClass("hide");
            this.ui.loadingImage.removeClass("hide");

            var selectize = this.ui.permissions[0].selectize;
            var permissions = selectize.getValue();

            var date = new Date().getTime();

            // value for album / non
            //this.ui.newPostText.val();

            var files = this.dropzone.files;
            var postDeferreds = [];

            for (var i=0; i < files.length; i++) {
                var file = files[i];

                var post = new Post();
                post.set({created: date, permissions: permissions});

                var postText = file.caption;
                if (postText && postText.length > 0) {
                    post.set({hasText: true, textData: postText});
                }

                var imageElement = $(file.previewElement).find(".dz-details").children("img").get(0);
                if (imageElement) {
                    var resizedData = ImageUtil.resize(imageElement, 300, 300);
                    var fullsizeData = ImageUtil.resize(imageElement, 1920, 1440);
                    post.set({hasImage: true, resizedImageData: resizedData, fullImageData: fullsizeData });
                }

                var deferred = post.uploadPost();
                $.when(deferred).done(function() {
                    createPostView.dropzone.emit("success", file);
                });
                postDeferreds.push(deferred);
            }

            $.when.apply($, postDeferreds).then(function() {
                var posts = arguments;

                for (var i=0; i < posts.length; i++) {
                    var post = posts[i];
                    if (post) {
                        App.state.myPosts.create(post, {wait:true});
                    }
                }

                App.vent.trigger("post:created");

                createPostView.ui.newPostForm.trigger('reset');
                createPostView.ui.newPostDiv.removeClass("in");
                createPostView.ui.newPostTrigger.show();

                createPostView.ui.postSubmitButton.removeClass("hide");
                createPostView.ui.loadingImage.addClass("hide");

                createPostView.dropzone.removeAllFiles();

                createPostView.trigger("post:submit", post);

                selectize.clear();

            });
        },

        expendForm: function() {
            this.ui.newPostDiv.addClass("in");
            this.ui.newPostTrigger.hide();
        },

        setupPermissionTags: function() {
            var perms = this.options.permissions.toJSON();
            var selectDiv = this.ui.permissions.selectize({
                plugins: ['remove_button'],
                delimiter: ',',
                persist: false,
                valueField: "id",
                labelField: "display",
                searchField: "display",
                options: perms,
                create: false
            });

            var selectize = selectDiv[0].selectize;
            selectize.addItem("all");
        },

        setupFileDropzone: function() {
            Dropzone.autoDiscover = false;
            this.dropzone = new Dropzone(this.ui.dropzone.get(0), {
                autoProcessQueue: false,
                url: "nope",
                addRemoveLinks: true,
                thumbnailWidth: null,
                thumbnailHeight: null,
                dictRemoveFile: '<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>'
            });
            this.dropzone.on("addedfile", function(file) {

                file._captionLink = Dropzone.createElement("<a class=\"dz-caption\" href=\"javascript:undefined;\" data-dz-caption>" +
                '<span class="glyphicon glyphicon-comment" aria-hidden="true"></span>' + "</a>");
                file.previewElement.appendChild(file._captionLink);

                var captionFileEvent = (function() {
                    return function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        Bootbox.prompt({
                            title: "Image Caption:",
                            value: file.caption ? file.caption: "",
                            inputType: "textarea",
                            callback : function(result) {
                                file.caption = result;
                            }
                        });
                    };
                })(this);
                var elements = file.previewElement.querySelectorAll("[data-dz-caption]");
                var results = [];
                for (var i = 0; i < elements.length; i++) {
                    var captionLink = elements[i];
                    results.push(captionLink.addEventListener("click", captionFileEvent));
                }
                return results;
            });
        }
    });
    return NewPostView;
});