define([
    'jquery',
    'underscore',
    'marionette',
    'require-text!app/templates/headerPanel.html'

], function($, _, Marionette, HeaderPanelTemplate) {

    var HeaderPanelView = Marionette.ItemView.extend({
        template: _.template(HeaderPanelTemplate),

        initialize: function () {
            this.listenTo(this.model, 'change', this.render);
        }
    });

    return HeaderPanelView;
});
