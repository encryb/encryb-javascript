define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'cloudGrid',
    'selectize',
    'app/app',
    'app/adapters/post',
    'app/models/post',
    'compat/windowUrl',
    'utils/image',
    'require-text!app/templates/editPost.html',
    'require-text!app/templates/postFile.html',
    'require-text!app/templates/postImage.html',
], function($, _, Backbone, Marionette, CloudGrid, Selectize, App,
            PostAdapter, Post, WindowUrl, ImageUtil, EditPostTemplate, PostFileTemplate, PostImageTemplate){

    var EditPostView = Marionette.CompositeView.extend({
        template: _.template( EditPostTemplate ),

        initialize: function() {
            console.log("this.model", this.model);
            this.listenTo(this.options.permissions, "add", this.permissionAdded);
            this.listenTo(this.options.permissions, "remove", this.permissionRemoved);

            console.log("perm1" , this.model.get("permissions"));
        },

        ui: {
            cancelButton: '#postEditCancelButton',
            editPostText: '#editPostText',
            permissions: "#permissions",
            loadingImage: ".loading-img",
            buttons: '.btn-group',
            editImages: '.editImages',
            editFiles: '.editFiles'
        },

        events: {
            'click @ui.cancelButton': 'cancelEdit',
            'submit form': 'editPost'
        },

        postImageTemplate: _.template(PostImageTemplate),
        postFileTemplate: _.template(PostFileTemplate),

        onRender: function(){
            this.setupPermissionTags();
        },

        onShow: function() {
            var editImagesElement = this.ui.editImages;
            var editFilesElement = this.ui.editFiles;
            var imageChildren = [];
            var fileChildren = [];

            if (this.model.has("content")) {
                var password = this.model.get("password");
                var collection = this.model.get("content");
                collection.each(function (model, index) {
                    var attrs = {};
                    _.extend(attrs, model.attributes, {removable: true});
                    if (model.has("thumbnailUrl")) {
                        var imageElement = $(this.postImageTemplate(attrs));

                        if (!model.has("thumbnail")) {
                            imageElement.css("background-color", "#ebebeb");
                        }
                        else {
                            imageElement.css("background-image", "url(" + model.escape("thumbnail") + ")");
                            imageElement.css("background-size", "100% auto");
                        }
                        $.data(imageElement, 'grid-columns', 6);
                        $.data(imageElement, 'grid-rows', 4);
                        editImagesElement.append(imageElement);
                        imageChildren.push(imageElement);
                    }
                    else if (model.has("filename")) {
                        var fileElement = $(this.postFileTemplate(attrs));
                        $.data(fileElement, 'grid-columns', 8);
                        $.data(fileElement, 'grid-rows', 3);
                        editFilesElement.append(fileElement);
                        fileChildren.push(fileElement);
                    }
                }, this);
            }

            // TODO: stupid DOM and timeout requirement
            setTimeout(function() {
                editImagesElement.cloudGrid({
                    children: imageChildren,
                    gridGutter: 3,
                    gridSize: 25
                });

                editFilesElement.cloudGrid({
                    children: fileChildren,
                    gridGutter: 3,
                    gridSize: 25
                });
            }, 500);

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
        editPost: function(event) {
            event.preventDefault();

            this.ui.buttons.addClass("hide");
            this.ui.loadingImage.removeClass("hide");

            setTimeout(this._createPost.bind(this), 0);
        },


        _createPost: function() {


            var selectize = this.ui.permissions[0].selectize;
            var permissions = selectize.getValue();

            var changes = {};
            if (!_.isEqual(this.model.get("permissions"), permissions)) {
                changes['permissions'] = permissions;
            }


            var text = this.ui.editPostText.val();
            if (text != this.model.get("text")) {
                changes['text'] = text;
            }

            App.vent.trigger("post:edited", changes);
        },

        cancelEdit: function () {
            App.vent.trigger("post:edit:canceled");
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
            selectize.addItems(this.model.get("permissions"));
        }

    });
    return EditPostView;
});