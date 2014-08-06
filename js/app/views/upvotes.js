define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'app/views/comment',
  'require-text!app/templates/upvote.html',
  'require-text!app/templates/upvotes.html'

], function($, _, Backbone, Marionette, CommentView, UpvoteTemplate, UpvotesTemplate) {

  var UpvoteView = Marionette.ItemView.extend({
      template: _.template( UpvoteTemplate )
  });

  var UpvotesView = Marionette.CompositeView.extend({
      template: _.template( UpvotesTemplate ),
      templateHelpers: {
          sumUpvotes: function(){
              var sum = this.upvoteCount;
              if (this.upvoted) {
                  sum++;
              }
              return sum;
          }
      },
      childView: UpvoteView,
      childViewContainer: "#upvotes",
      modelEvents: {
          "change": "render"
      }

  });
  return UpvotesView;
});
