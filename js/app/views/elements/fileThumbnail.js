define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'app/app',
    'utils/misc',
    'require-text!app/templates/postFile.html',
], function($, _, Backbone, Marionette, App, MiscUtils, PostFileTemplate) {


    var FileThumbnailView = Marionette.ItemView.extend({
        template: _.template(PostFileTemplate),
        templateHelpers: function(){
            var removable = this.removable;
            var size = this.model.get("size");
            return {
                isRemovable: function () {
                    return removable;
                },
                getSize: function () {
                    return MiscUtils.formatSize(size);
                }
            }
        },
        className: "gridItem border-file pos-relative",
        modelEvents: {
            'change': 'render'
        },
        events: {
            'click .downloadable': 'download',
            'click .removeFile': 'removeFile',
            'click .restoreFile': 'restoreFile'
        },

        initialize: function (options) {
            if (options.removable == true) {
                this.removable = true;
            }
            else {
                this.removable = false;
            }
            this.password = options.password;
        },
        download: function () {
            if (!this.model.has("data") && !this.model.has("dataCached")) {
                this.$el.find(".downloadImage").addClass("hide");
                this.$el.find(".downloadLoadingImage").removeClass("hide");
            }
            App.vent.trigger("file:download", this.model, this.password);
        },
        removeFile: function () {
            console.log("Remove!");
            this.model.set("deleted", true);
        },

        restoreFile: function () {
            console.log("restore!");
            this.model.unset("deleted");
        }
    });

    return FileThumbnailView;
});
