define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'marionette',
    'jquery.swipebox',
    'autolinker',
    'app/app',
    'app/adapters/post',
    'utils/misc',
    'require-text!app/templates/postContent.html'

], function($, _, Backbone, Bootsrap, Marionette, Swipebox, Autolinker, App, PostAdapter, MiscUtils, PostContentTemplate){

    var PostContentView = Marionette.ItemView.extend({

        template: _.template( PostContentTemplate ),
        templateHelpers: {
            prettyTime: function() {
                return MiscUtils.formatTime(this.created);
            },
            formatText: function() {
              if (!this.hasOwnProperty('textData')) {
                  return "";
              }
              return Autolinker.link(this.textData);
            },
            permissionsIcon: function() {
                if (!this.permissions || this.permissions.length == 0) {
                    return "img/sharedNot.png";
                }
                if (this.permissions.indexOf("all") >= 0) {
                    return "img/sharedAll.png";
                }
                return "img/sharedSome.png"
            }
        },

        initialize: function() {
            PostAdapter.fetchPost(this.model, false);
            this.listenTo(this.model.get("poster"), "change", this.render);
        },

        'modelEvents': {
            'change': 'render'
        },

        events: {
            "click #resizedImage": "showImage",
            "click .post-thumbnail": "clickedPosterPicture"
        },

        showImage: function(){
            var view = this;

            var mediaDeferred = $.Deferred();
            $.when(PostAdapter.fetchPost(this.model, true)).done(function(){
                mediaDeferred.resolve(view.model.get('fullImageData'));
            });

            $.swipebox(
                [
                    { href: mediaDeferred.promise(), title: view.model.get('textData') }
                ] );


        },

        clickedPosterPicture: function() {
            if (this.model.get("myPost")) {
                return false;
            }
            App.vent.trigger("friend:selected", this.model.get("poster"));
        }


    });
    return PostContentView;
});