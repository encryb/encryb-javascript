define([
    'jquery',
    'underscore',
    'backbone',
    'bootbox',
    'marionette',
    'app/app',
    'require-text!app/templates/friendDetails.html',
    'require-text!app/templates/friend.html'
], function ($, _, Backbone, Bootbox, Marionette, App, FriendsDetailsTemplate, FriendOfFriendTemplate) {

    var FriendOfFriendView = Marionette.ItemView.extend({
        template: _.template(FriendOfFriendTemplate),
        className: "pull-left margin-right-15"
    });

    var FriendsDetailsView = Marionette.CompositeView.extend({

        template: _.template(FriendsDetailsTemplate),

        templateHelpers: function(){
            var collection = this.collection;
            return {
                numberOfFriends: function(){
                    return collection.length;
                }
            }
        },

        events: {
            'click #favoriteButton' : "toggleFavorite",
            'click #unfriendButton' : "unfriend",
            'click #unselectFriend' : "unselectFriend"
        },



        childView: FriendOfFriendView,
        childViewContainer: "#friendsOfFriends",

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        },

        toggleFavorite: function() {
            this.model.set("favorite", !this.model.get("favorite"));
            this.model.save();
        },

        unfriend: function() {
            var friend = this.model;
            Bootbox.confirm("Unfriend " + friend.get("name") + "?", function(result) {
                if (result) {
                    App.vent.trigger("friend:unfriend", friend);

                }
            });
        },
        unselectFriend: function() {
            App.vent.trigger("friend:unselect");
        }


    });

    return FriendsDetailsView;
});
