define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'app/views/comment',
  'require-text!app/templates/comments.html'

], function($, _, Backbone, Marionette, CommentView, CommmentsTemplate) {

  var CommentsView = Marionette.CompositeView.extend({
      template: _.template( CommmentsTemplate ),
      childView: CommentView,
      childViewContainer: "#comments"
  });
  return CommentsView;
});
