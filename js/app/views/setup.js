define([
    'jquery',
    'underscore',
    'backbone',
    'bootstrap',
    'bootbox',
    'marionette',
    'require-text!app/templates/setup.html',
    'require-text!app/templates/password.html'

], function($, _, Backbone, Bootstrap, Bootbox, Marionette, SetupTemplate, PasswordTemplate){

    var SetupView = Marionette.ItemView.extend({

        template: _.template(SetupTemplate),

        templateHelpers: {
            toMB: function (value) {
                return Math.round(value / 1000000) + "MB";
            },
            ratio: function (dropboxInfo) {
                return Math.round(100 * dropboxInfo.usedQuota / dropboxInfo.quota);
            }
        },

        events: {
            "change #uploadKeysInput": "uploadKey",
            "click #removeKeysButton": "removeKey",
            "click #createNewKeysButton": "createKey",
            "click #saveKeysToDropboxButton": "saveKeyToDropbox",
            "click #loadKeysFromDropboxButton" : "loadKeyFromDropbox"

        },

        triggers: {
            "click #dropboxLogout": "dropbox:logout",
            "click #dropboxLogin": "dropbox:login",
            "click #downloadKeysButton": "keys:download",
            "click #continueButton": "continue"
        },

        initialize: function () {
            this.model.on('change', this.render);
        },

        removeKey: function() {
            var view = this;


            Bootbox.confirm("Are you sure? Without the encryption keys will not be able to read friends' posts!", function(result) {
                if (result) {
                    view.trigger("keys:remove");
                }
            });
        },
        createKey: function() {
            var view = this;
            Bootbox.prompt({
                title    : "Keys Created! To ensure proper access to your friends post, please backup your key. Options are: ",
                inputType : 'checkbox',
                inputOptions : [
                    { text : 'Save to your computer', value: 'keys:download', name: 'file'},
                    { text : 'Save to Dropbox', value: 'keys:saveToDropbox', name: 'dropbox'}
                ],
                callback : function(values) {
                    var download = false;
                    var save = false;
                    
                    if (values == null) {
                        return;
                    }
                    
                    for (var i=0; i<values.length; i++) {
                        var value = values[i];
                        
                        if (value == "keys:download") {
                            download = true;
                        }
                        else if (value =="keys:saveToDropbox") {
                            save = true;
                        }
                    }
                    view._passwordDialog().done(function(password) {
                        view.trigger("keys:create", password, {download: download, save: save});    
                    });                 
                }                    
                
                
            });
        },
        loadKeyFromDropbox: function() {
            var view = this;
            this._passwordDialog(false).done(function(password){
                view.trigger("keys:loadFromDropbox", password);
            });
        },


        uploadKey: function(event) {
            var reader = new FileReader();

            var view = this;
            reader.onload = (function(e) {
                view._passwordDialog(false).done(function(password){
                    view.trigger("keys:upload", password, reader.result);
                });
            });

            reader.readAsArrayBuffer(event.target.files[0]);
        },

        _passwordDialog: function(verify) {
            var title;
            if (verify) {
                title = "Enter password. Keep this password safe, as it is not stored on Encryb, and you will not be able\
                    to recover the encryption keys without it"
            }
            else {
                title = "Enter password";
            }
            var deferred = $.Deferred();
            var dialog = Bootbox.dialog({
                title: title,
                message: PasswordTemplate,
                buttons: {
                    success: {
                        label: "OK",
                        className: "btn-default",
                        callback: function () {
                            var password1 = $("#passwordDialog1").val();
                            var password2 = $("#passwordDialog2").val();
                            if (password1 != password2) {
                                $("#passwordDialogAlert").removeClass("hide");
                                $("#passwordDialogAlert").text("Passwords do not match");
                                return false;
                            }

                            if (password1.length < 1) {
                                $("#passwordDialogAlert").removeClass("hide");
                                $("#passwordDialogAlert").text("Invalid Password");
                                return false;
                            }
                            deferred.resolve(password1);
                        }
                    }
                }
            });
            dialog.bind("shown.bs.modal", function() {
                $("#passwordDialog1").focus();
            } )
            return deferred;
        }
    });
    return SetupView;
});