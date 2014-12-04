define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'marionette',
    'cloudGrid',
    'jquery.swipebox',
    'autolinker',
    'app/app',
    'app/adapters/post',
    'utils/misc',
    'require-text!app/templates/postImage.html',
    'require-text!app/templates/postContent.html'

], function($, _, Backbone, Bootsrap, Marionette, CloudGrid, Swipebox, Autolinker, App, PostAdapter, MiscUtils,
            PostImageTemplate, PostContentTemplate){


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

        ui: {
            postImages: '.postImages'
        },

        modelEvents: {
            'change': 'render'
        },

        events: {
            "click .post-thumbnail": "clickedPosterPicture"
        },

        initialize: function() {
            this.listenTo(this.model.get("poster"), "change", this.render);
        },

        postImageTemplate: _.template(PostImageTemplate),

        onRender: function() {

            var postImagesElement = this.ui.postImages;
            var children = [];

            if (this.model.has("content")) {
                var collection = this.model.get("content");
                var isFirst = true;
                collection.each(function (model, index) {
                    var imageElement = $(this.postImageTemplate(model.attributes));
                    imageElement.click(function() {
                        this.showImage(index);
                    }.bind(this));

                    imageElement.css("background-image", "url(" + model.escape("resizedImageData") + ")");
                    var ratio = model.resizedWidth / model.resizedHeight;
                    var cols, rows;
                    if (ratio > 2.5) {
                        cols = 4;
                        rows = 2;
                    }
                    else if (ratio < 0.5) {
                        cols = 3;
                        rows = 3;
                    }
                    else {
                        cols = 4;
                        rows = 3;
                    }
                    if (isFirst) {
                        cols = cols * 2;
                        rows = rows * 2;
                        isFirst = false;
                    }
                    $.data(imageElement, 'grid-columns', cols);
                    $.data(imageElement, 'grid-rows', rows);
                    postImagesElement.append(imageElement);
                    children.push(imageElement);
                }, this);
            }

            setTimeout(function() {
                postImagesElement.cloudGrid({
                    children: children,
                    gridGutter: 2,
                    gridSize: 30
                });


                $(window).on('resize', function () {
                    postImagesElement.cloudGrid('reflowContent');
                })
            }, 0);

        },

        showImage: function(index){
            var swipeboxArgs = [];
            this.model.get("content").each(function(content) {
                swipeboxArgs.push({href:content.getFullImage(),title:content.get("textData")|| ""})
            });
            $.swipebox(swipeboxArgs, {initialIndexOnArray:index});
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