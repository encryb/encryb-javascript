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
        tagName: 'tr',
        className: 'fileThumb pointer-hand',
        modelEvents: {
            'change': 'render'
        },
        events: {
            'click .downloadable': 'download',
            'click .removeFile': 'removeFile',
            'click .restoreFile': 'restoreFile',
            'click .abortDownload': 'abortDownload'
        },
        initialize: function (options) {
            if (options.removable == true) {
                this.removable = true;
            }
            else {
                this.removable = false;
            }
        },
        download: function () {
            if (!this.model.has("progress")) {
                App.vent.trigger("file:download", this.model);
            }
        },
        removeFile: function () {
            this.model.set("deleted", true);
        },

        restoreFile: function () {
            this.model.unset("deleted");
        },
        abortDownload: function(event) {
            this.model.get("abortDownload")();
            return false;
        }
    });

    return FileThumbnailView;
});
