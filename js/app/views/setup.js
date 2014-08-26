define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'require-text!app/templates/setup.html'

], function($, _, Backbone, Marionette, SetupTemplate){

    var SetupView = Marionette.ItemView.extend({

        template: _.template( SetupTemplate ),

        events: {
            "click #dropboxLogout": "dropboxLogout",
            "click #dropboxLogin": "dropboxLogin"
        },

        initialize: function () {
            this.model.on('change', this.render);
        },

        dropboxLogout: function() {
            this.trigger("dropbox:logout");
        },
        dropboxLogin: function() {
            this.trigger("dropbox:login");
        }

    });
    return SetupView;
});