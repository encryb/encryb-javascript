define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'require-text!app/templates/comment.html'

], function($, _, Backbone, Marionette, CommmentTemplate) {

  var CommentView = Marionette.ItemView.extend({

    // Cache the template function for a single item.
    template: _.template( CommmentTemplate )
  });
  return CommentView;
});
