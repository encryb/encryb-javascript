define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'utils/misc',
    'require-text!app/templates/chat.html',
    'require-text!app/templates/chatLine.html'
], function($, _, Backbone, Marionette, MiscUtils, ChatTemplate, ChatLineTemplate) {

    var ChatLineView = Marionette.ItemView.extend({
        template: _.template(ChatLineTemplate),
        tagName: "li",
        templateHelpers: {
            prettyTime: function() {
                return MiscUtils.formatFullTime(this.time);
            }
        },

    });

    var ChatView = Marionette.CompositeView.extend({
        template: _.template( ChatTemplate ),
        className: "pull-right clearfix",
        childView: ChatLineView,
        childViewContainer: ".chat",

        initialize: function() {
            this.collection = this.model.get("chatLines")
        },

        templateHelpers: function() {
            var uniqueId = _.uniqueId("_chat_");
            return {
                uniqueId: function() {
                    return uniqueId;
                }
            }
        },
        ui: {
            panelBody : ".panel-body",
            panel : ".panel",
            textinput: "textarea"
        },

        events: {
            'mousewheel @ui.panelBody': 'scrollCheck',
            'click @ui.panel': 'clickPanel',
            'keydown @ui.textinput': 'submitChat'
        },

        collectionEvents: {
            "add": "modelAdded"
        },

        modelAdded: function() {
            if (this.ui.panelBody.scrollTop() + this.ui.panelBody.outerHeight() >= this.ui.panelBody.prop("scrollHeight")) {
                // TODO, check if there is better way to do this
                setTimeout(_.bind(function() {
                    this.ui.panelBody.scrollTop(this.ui.panelBody.prop("scrollHeight"));
                }, this));
            }
        },

        submitChat: function(e) {
            if (e.keyCode == 13) {
                if (this.ui.textinput.val().length == 0) {
                    return false;
                }
                var model = new Backbone.Model({name:"Me", text:this.ui.textinput.val(), time:new Date().getTime()});
                this.collection.add(model);
                this.ui.textinput.val("");


                return false;
            }
        },
        clickPanel: function() {
            this.ui.panel.removeClass("panel-primary").addClass("panel-default");
            console.log($(".panel").is(":focus"));
            console.log("BOOOOOOOOOOOOOBBOOOOOOOOOOOOOOOOLLLLLLLLLAAAAAAAAAAAAAa");
        },

        scrollCheck: function(e) {
            return MiscUtils.isScrollOverflow(e);
        }
    });

    var ChatsView = Marionette.CollectionView.extend({
        childView: ChatView,
        className: "overlay rotate clearfix margin-right-5"
    });
    return ChatsView;
});
