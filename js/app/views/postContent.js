define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'app/views/modals',
    'utils/misc',
    'require-text!app/templates/postContent.html'

], function($, _, Backbone, Marionette, Modals, MiscUtils, PostContentTemplate){

    var PostContentView = Marionette.ItemView.extend({

        template: _.template( PostContentTemplate ),
        templateHelpers: {
            prettyTime: function() {
                return MiscUtils.formatTime(this.created);
            }
        },

        initialize: function() {
            this.model.fetchPost(false);
        },

        'modelEvents': {
            'change': 'render'
        },

        events: {
            "click #resizedImage": "showImage",
            "click #deletePost": "deletePost"
        },

        showImage: function(){
            Modals.showImage(this.model);
        }

    });
    return PostContentView;
});