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
            },
            permissionsIcon: function() {
                if (this.permissions.length == 0) {
                    return "img/sharedNot.png";
                }
                if (this.permissions.indexOf("all") >= 0) {
                    return "img/sharedAll.png";
                }
                return "img/sharedSome.png"
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