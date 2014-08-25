define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'require-text!app/templates/setup.html'

], function($, _, Backbone, Marionette, SetupTemplate){

    var SetupView = Marionette.ItemView.extend({

        template: _.template( SetupTemplate )

    });
    return SetupView;
});