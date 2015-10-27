define([
    'jquery',
    'simplecrypto',
], function($, SimpleCrypto){

    var keyCache = null;

/*
                     onSuccess({privateKey: privateKey, publicKey: keys.publicKey, 
                                privateJwk: privateJwk, publicJwk: publicJwk});
*/
    var Keys = {

        createKeys: function() {
            keyCache = {};
            var deferred = $.Deferred();
            SimpleCrypto.asym.generateEncryptKey(
                deferred.reject,
                function(rsaKeys) {
                    keyCache["rsa"] = rsaKeys;
                    SimpleCrypto.sym.generateKeys(
                        deferred.reject,
                        function(dbKeys) {
                            keyCache["db"] = dbKeys;
                            Keys.saveKeysToSecureStorage()
                            .done(function(){
                                deferred.resolve(keyCache);    
                            })
                            .fail(deferred.reject);        
                        });
                    });
            return deferred.promise();
        },
        
        serializeKeys: function() {
            
            
            if (!("rsa" in keyCache && "privateJwk" in keyCache.rsa && "publicJwk" in keyCache.rsa
                && "db" in keyCache && "aesKey" in keyCache.db && "hmacKey" in keyCache.db )) {
                    return null;
            }

            var aesKey = SimpleCrypto.util.bytesToString(keyCache.db.aesKey);
            var hmacKey = SimpleCrypto.util.bytesToString(keyCache.db.hmacKey);
            
            var keys = {
                rsa : {privateKey: keyCache.rsa.privateJwk, publicKey: keyCache.rsa.publicJwk},
                db: {aesKey: aesKey, hmacKey: hmacKey}
            };
            
            return JSON.stringify(keys);            
        },
        
        serializeAndEncryptKeys: function(password) {
            var deferred = $.Deferred();
            
            
            var keys = Keys.serializeKeys();
            
            if (keys == null) {
                deferred.reject("Private Key not available")
                return deferred.promise();
            }
            
            var privateKey = SimpleCrypto.util.stringToBytes(keys);
            SimpleCrypto.sym.encryptWithPassword(password, privateKey, 
                function(error) {
                    deferred.reject("Could not encrypt private key", error);
                },
                function(encrypted) {
                    try {
                        var encoded = SimpleCrypto.pack.encode(encrypted);
                        deferred.resolve(encoded);
                    }
                    catch (e) {
                        deferred.reject("Could not pack encrypted key", e.message);
                    }
                });
        
            return deferred.promise();
        },
        
        unserializeKeys: function(encodedKeys) {
            var keys = JSON.parse(encodedKeys);
                            
            keys.db.aesKey = SimpleCrypto.util.stringToBytes(keys.db.aesKey);
            keys.db.hmacKey = SimpleCrypto.util.stringToBytes(keys.db.hmacKey);
                
            return keys;
        },
        
        decryptAndUnserializeKeys: function(password, encoded) {
            var deferred = $.Deferred();
            var encrypted;
            try {
                encrypted = SimpleCrypto.pack.decode(encoded);
            }
            catch (e) {
                deferred.reject("Could not unpack the encrypted key", e.message);
            }
            if (typeof encrypted !== "undefined") {
                SimpleCrypto.sym.decryptWithPassword(password, encrypted, 
                    function(error) {
                        deferred.reject("Invalid data/password", error);
                    },
                    function(keyBuffer) {
                        try {
                            var keyString = SimpleCrypto.util.bytesToString(keyBuffer);                            
                            var keys  = Keys.unserializeKeys(keyString);
                            deferred.resolve(keys);
                        }
                        catch (e) {
                            deferred.reject("Could not parse keys: " + e.message);
                        } 
                    });
            }
            
            return deferred.promise();
        },
        
        importKeys: function(keys) {
            var deferred = $.Deferred();
            keyCache = {};
            SimpleCrypto.asym.importEncryptKey(keys.rsa.publicKey, keys.rsa.privateKey,
                deferred.reject,
                function(rsa) {
                    SimpleCrypto.sym.importKeys(keys.db,
                        deferred.reject,
                        function(db) {
                            keyCache["rsa"] = rsa;
                            keyCache["db"] = db;
                            deferred.resolve(keyCache);
                        });
                });
            return deferred.promise();
        },
        
        
        exportKeys: function() {
            var deferred = $.Deferred();
            
            var keys = {};
            
            // check if we actually can export
            keys["rsa"] = {publicKey: keyCache.rsa.publicJwk, privateKey: keyCache.rsa.privateJwk};
            keys["db"] = {aesKey: keyCache.db.aesKey, hmacKey: keyCache.db.hmacKey}; 
            
            deferred.resolve(keys);
            
            return deferred.promise();
        },
        
        saveKeysToSecureStorage: function () {
            var deferred = $.Deferred();
            
            
            if (!("rsa" in keyCache && "privateKey" in keyCache.rsa && "publicKey" in keyCache.rsa && "publicJwk" in keyCache.rsa
                && "db" in keyCache && "aesKeyObj" in keyCache.db && "hmacKeyObj" in keyCache.db )) {
                    deferred.reject("Invalid Key");
                    return deferred.promise();
            }
            
            SimpleCrypto.storage.put("encrypt.privateKey", keyCache.rsa.privateKey, 
              deferred.reject,
              function() {
                SimpleCrypto.storage.put("encrypt.publicKey", keyCache.rsa.publicKey,
                  deferred.reject,
                  function() {
                    SimpleCrypto.storage.put("encrypt.publicJwk", keyCache.rsa.publicJwk,
                      deferred.reject,
                      function() {
                        SimpleCrypto.storage.put("db.aesKeyObj", keyCache.db.aesKeyObj, 
                          deferred.reject,
                          function() {
                            SimpleCrypto.storage.put("db.hmacKeyObj", keyCache.db.hmacKeyObj,
                            deferred.reject,
                            deferred.resolve);                              
            }); }); }); });
            return deferred.promise();
        },
        
        hasKeys: function() {
            var deferred = $.Deferred();
            this.getKeys()
                .done(function(keys) {
                    if ("rsa" in keys && "privateKey" in keys.rsa && "publicKey" in keys.rsa && "publicJwk" in keys.rsa &&
                        "db" in keys && "aesKeyObj" in keys.db && "hmacKeyObj" in keys.db) {
                        var exportable = ("privateJwk" in keys.rsa && "aesKey" in keys.db && "hmacKey" in keys.db);
                        deferred.resolve({keys: true, exportable: exportable}); 
                    }
                    else {
                        deferred.resolve({keys: false});
                    }
                    
                })
                .fail(function() {
                    deferred.resolve({keys: false});
                });
            return deferred.promise();
            
        },
        
        
        _getEncryptKeysFromStorage: function() {
            var deferred = $.Deferred();
            SimpleCrypto.storage.get("encrypt.privateKey", 
                deferred.reject,
                function(privateKey) {
                    if (typeof privateKey === "undefined") {
                        deferred.reject("privateKey not found");
                        return;
                    }
                    SimpleCrypto.storage.get("encrypt.publicKey",
                        deferred.reject,
                        function(publicKey) {
                            if (typeof publicKey === "undefined") {
                                deferred.reject("publicKey not found");
                                return;
                            }
                            SimpleCrypto.storage.get("encrypt.publicJwk",
                                deferred.reject,
                                function(publicJwk) {
                                    if (typeof publicJwk === "undefined") {
                                        deferred.reject("publicJwk not found");
                                        return;
                                    }
                                    deferred.resolve({publicKey: publicKey, privateKey: privateKey, publicJwk: publicJwk});
                                });
                        });
                });
            return deferred.promise();  
        },
        
        
        
        _getDBKeysFromStorage: function() {
            var deferred = $.Deferred();
            SimpleCrypto.storage.get("db.aesKeyObj", 
                deferred.reject,
                function(aesKey) {
                    if (typeof aesKey === "undefined") {
                        deferred.reject("db AES Key not found");
                        return;
                    }
                                    
                    SimpleCrypto.storage.get("db.hmacKeyObj", 
                        deferred.reject,
                        function(hmacKey) {
                            if (typeof hmacKey === "undefined") {
                                deferred.reject("db HMAC Key not found");
                                return;
                            }
                            deferred.resolve({aesKeyObj: aesKey, hmacKeyObj: hmacKey});
                        });
                });
            return deferred.promise();  
        },
        
        getKeys: function() {
            var deferred = $.Deferred();
            if (keyCache) {
                deferred.resolve(keyCache);
            }
            else {
                $.when(this._getDBKeysFromStorage(), this._getEncryptKeysFromStorage())
                    .done(function(dbKeys, encryptKeys) {
                        deferred.resolve({rsa: encryptKeys, db: dbKeys});
                    })
                    .fail(deferred.reject);
            }
            return deferred.promise();
        },
        
        removeKeys: function() {
            var deferred = $.Deferred();
            SimpleCrypto.storage.delete("encrypt.privateKey", 
                deferred.reject,
                function() {
                    SimpleCrypto.storage.delete("encrypt.publicKey",
                        deferred.reject,
                        function() {
                            SimpleCrypto.storage.delete("encrypt.publicJwk",
                                deferred.reject,
                                function() {
                                    SimpleCrypto.storage.delete("db.aesKey", 
                                        deferred.reject,
                                        function() {
                                            SimpleCrypto.storage.delete("db.hmacKey", 
                                                deferred.reject,
                                                deferred.resolve);
                                        });
                                });
                        });
                });
            return deferred.promise();  
        },
        
    };
    return Keys;
});