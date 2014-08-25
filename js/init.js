/*global require*/
'use strict';


require.config({
	waitSeconds : 15,

	baseUrl: 'js/lib',

	paths: {
		app: '../app',
		tpl: '../tpl',
		utils: '../utils',
        dropbox: 'https://www.dropbox.com/static/api/dropbox-datastores-1.0-latest',
        dropboxdatastore: 'backbone.dropboxDatastore',
        marionette: 'backbone.marionette',
        visibility: 'visibility-1.2.1.min'
	},

	shim: {
		jquery: {
			exports: '$'
		},
		underscore: {
			exports: '_'
		},
		backbone: {
			deps: ['jquery', 'underscore'],
			exports: 'Backbone'
		},
        dropboxdatastore: {
            deps: ['backbone'],
            exports: 'Backbone'
        },
		sjcl: {
			exports: 'sjcl'
		},
        dropbox: {
            exports: 'Dropbox'
        },
		bootstrap: {
            deps: ["jquery"]
        },
        'jasny-bootstrap': {
        	deps: ["bootstrap"]
        },
        'backbone-forms-bootstrap3' : {
            deps: ["backbone-forms"],
            exports: 'Backbone.Form'
        },
        'backbone.bootstrap-modal' : {
            deps: ["bootstrap"]
        },
        marionette : {
            deps : ['jquery', 'underscore', 'backbone'],
            exports : 'Marionette'
        },
        visibility: {
            exports: 'Visibility'
        }
	}
});

require([
    'backbone',
    'marionette',
    'app/app',
    'app/controllers/wall',
],
function (Backbone, Marionette, App, WallContr) {

    var AppRouter = Marionette.AppRouter.extend({
        appRoutes: {
            '': 'showWall',
            'settings': 'settings'
        }
    });

    new AppRouter({
        controller: new WallContr()
    });

    App.start();
});