define([
        'jquery',
        'underscore',
        'backbone',
        'marionette'
    ],
    function ($, _, Backbone, Marionette) {
        var App = new Marionette.Application();

        App.addRegions({
            main: '#ninjaturtle'
        });

        App.on("start", function(options){
            if (Backbone.history){
                Backbone.history.start();
            }
        });
        return App;
    });