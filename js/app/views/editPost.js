define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'selectize',
    'app/app',
    'app/adapters/post',
    'app/models/post',
    'compat/windowUrl',
    'utils/image',
    'require-text!app/templates/editPost.html'

], function($, _, Backbone, Marionette, Selectize, App,
            PostAdapter, Post, WindowUrl, ImageUtil, EditPostTemplate){

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
            buttons: '.btn-group'
        },

        events: {
            'click @ui.cancelButton': 'cancelEdit',
            'submit form': 'editPost'
        },

        onRender: function(){
            this.setupPermissionTags();
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