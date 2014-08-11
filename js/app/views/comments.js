define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'require-text!app/templates/comment.html',
    'require-text!app/templates/comments.html'

], function($, _, Backbone, Marionette, CommentTemplate, CommmentsTemplate) {
    var CommentView = Marionette.ItemView.extend({
        template: _.template( CommentTemplate )
    });

    var CommentsView = Marionette.CompositeView.extend({
        template: _.template( CommmentsTemplate ),
        childView: CommentView,
        childViewContainer: "#comments",
        events: {
            'submit form': 'createComment',
            'focusin #createCommentTrigger' : "expendCommentForm"
        },
        ui: {
            createCommentTrigger: '#createCommentTrigger',
            createCommentText: '#createCommentText',
            createCommentImage: '#createCommentImage',
            createCommentForm: '#createCommentForm',
            createCommentDiv: '#createCommentDiv'
        },
        expendCommentForm: function() {
            event.preventDefault();
            this.ui.createCommentDiv.addClass("in");
            this.ui.createCommentTrigger.hide();
        },
        createComment: function() {
            event.preventDefault();

            var date = new Date().getTime();
            var text = this.ui.createCommentText.val();
            if (!text || text.length === 0) {
                return;
            }

            var attr = {};
            attr['date'] = date;
            attr['text'] = text;
            this.trigger("comment:submit", attr);

            this.ui.createCommentForm.trigger('reset');
            this.ui.createCommentDiv.removeClass("in");
            this.ui.createCommentTrigger.show();

            console.log("comment added", attr);
        }
    });
    return CommentsView;
});
