define([
    'jquery',
    'backbone',
    'app/services/dropbox',
    'app/encryption/async',
    'app/encryption/keys'
], function($, Backbone, Dropbox, Encryption, Keys){

    var EncryptedDatastore = function(name, options) {
        options = options || {};
        this.name = "encrypt-1-" + name;
        this.datastoreId = options.datastoreId || 'default';
        this._syncCollection = null;
    };

    _.extend(EncryptedDatastore.prototype, Backbone.DropboxDatastore.prototype, {

        recordToJson: function(record) {
            var deferred = $.Deferred();

            var json = Backbone.DropboxDatastore.recordToJson(record);
            
            var createError = function(msg) {
                var errorJson = {};
                if (json.hasOwnProperty("id")) {
                    errorJson["id"] = json["id"];
                }
                errorJson["created"] = new Date().getTime();
                errorJson["errors"] = msg;
                return errorJson;
            }
            
            if (!json.hasOwnProperty("_enc_")) {
                deferred.resolve(createError("Unencrypted data"));
            }
            else {
                Keys.getKeys()
                .fail(function() {
                    deferred.resolve(createError("Could not get keys"));
                })
                .done(function(keys) {
                    var cipherdata = json._enc_.buffer;
                    Encryption.decryptText(keys.db, cipherdata)
                    .fail(function() {
                        deferred.resolve(createError("Could not decrypt"));            
                    })
                    .done(function(modelString) {
                        var decryptedJson = JSON.parse(modelString);
                        if (json.hasOwnProperty("id")) {
                            decryptedJson["id"] = json["id"];
                        }
                        deferred.resolve(decryptedJson);
                    });
                });
            }
            
            return deferred.promise();
        },
        
        modelToJson: function(model) {
            var deferred = $.Deferred();
            
            var clone = _.omit(model.toJSON(), ["id"]);
            var modelJson = JSON.stringify(clone);
           
            Keys.getKeys()
                .fail(function(error) {
                    var errorJson = {};
                    if (clone.hasOwnProperty("id")) {
                        errorJson["id"] = clone["id"];
                    }    
                    errorJson["created"] = new Date().getTime();
                    errorJson["error"] = "Unencrypted data";
                    deferred.resolve(errorJson);
                })
                .done(function(keys) {
                    Encryption.encrypt(keys.db, "text/json", modelJson, false)
                    .done(function(cipherdata) {
                        var json = {_enc_: new Uint8Array(cipherdata)};
                        if (clone.hasOwnProperty("id")) {
                            json["id"] = clone["id"];
                        }
                        deferred.resolve(json);
                    });
            });

            
            return deferred.promise();
        }

/*
        recordToJson: function(record) {
            var json = Backbone.DropboxDatastore.recordToJson(record);

            var exception = null;

            if (!json.hasOwnProperty("_enc_")) {
                return json;
            }

            var encryptedArray = json["_enc_"];

            try {
                var modelString = Encryption.decryptText(encryptedArray.buffer, Keys.getDatabaseKey());
                var decryptedJson = JSON.parse(modelString);
                if (json.hasOwnProperty("id")) {
                    decryptedJson["id"] = json["id"];
                }
                return decryptedJson;
            }
            catch (e) {
                exception = e;
            }

            // we have _enc_, but could not decrypt. Check if there is any plain data and if so return it without _enc_
            console.log("keys", Object.keys(json), exception);
            if (Object.keys(json).length > 2) {
                return _.omit(json, "_enc_");
            }

            if (exception){
                // $BUG We need to display errors in a bit better way
                var errorJson = {};
                if (json.hasOwnProperty("id")) {
                    errorJson["id"] = json["id"];
                }
                errorJson["created"] = new Date().getTime();
                errorJson["error"] = exception.toLocaleString();
                return errorJson;
            }

            return json;

        },

        modelToJson: function(model) {
            var clone = _.omit(model.toJSON(), ["id"]);
            var modelString = JSON.stringify(clone);

            var encryptionKey = Sjcl.codec.bytes.toBits(Keys.getDatabaseKey());

            var encrypted = Encryption.encrypt(encryptionKey, null, modelString, false);
            var encryptedArray  = new Uint8Array(encrypted);
            var json = {};
            if (model.has("id")) {
                json["id"] = model.get("id");
            }
            json["_enc_"] =  encryptedArray;
            return json;
        }
        
*/
    });
    return EncryptedDatastore;
});
