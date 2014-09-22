define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'utils/misc',
    'require-text!app/templates/postContent.html'


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
        }

    });
    return PostContentView;
});