define([
    'jquery',
    'simplecrypto',
    'sjcl'
], function($, SimpleCrypto, Sjcl){

    var keyCache = null;

/*
                     onSuccess({privateKey: privateKey, publicKey: keys.publicKey, 
                                privateJwk: privateJwk, publicJwk: publicJwk});
*/
    var keys = {

        createKeys: function() {
            var deferred = $.Deferred();
            SimpleCrypto.asym.generateEncryptKey(
                deferred.reject,
                function(encryptionKeys) {
                    keyCache = encryptionKeys;
                    keys.saveKeysToSecureStorage()
                        .done(function(){
                            deferred.resolve(encryptionKeys);    
                        })
                        .fail(deferred.reject);
                }
            );
            return deferred.promise();
        },
        
        serializeKeys: function(password) {
            var deferred = $.Deferred();
            if (typeof keyCache === "undefined" || !keyCache.hasOwnProperty("privateJwk")) {
                deferred.reject("Private Key not available");
            }
            else {
                var keys = {privateKey: keyCache.privateJwk, publicKey: keyCache.publicJwk};
                var privateKey = SimpleCrypto.util.stringToBytes(JSON.stringify(keys));
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
            }
            
            return deferred.promise();
        },
        unserializeKeys: function(password, encoded) {
            var deferred = $.Deferred();
            var encrypted;
            try {
                encrypted = SimpleCrypto.pack.decode(encoded);
            }
            catch (e) {
                deferred.reject("Could not unpack encrypted key", e.message);
            }
            if (typeof encrypted !== "undefined") {
                SimpleCrypto.sym.decryptWithPassword(password, encrypted, 
                    function(error) {
                        deferred.reject("Could not decrypt private key", error);
                    },
                    function(keyBuffer) {
                        try {
                            var keyString = SimpleCrypto.util.bytesToString(keyBuffer);
                            var keys = JSON.parse(keyString);
                            deferred.resolve(keys);
                        }
                        catch (e) {
                            deferred.reject("Could not parse keys: " + e.message);
                        } 
                    });
            }
            
            return deferred.promise();
        },
        
        importKeys: function(jwk) {
            var deferred = $.Deferred();            
            SimpleCrypto.asym.importEncryptKey(jwk.publicKey, jwk.privateKey,
                deferred.reject,
                function(keys) {
                    keyCache = { privateKey: keys.privateKey, publicKey: keys.publicKey, 
                        publicJwk: jwk.publicKey };
                    deferred.resolve();
                });
            return deferred.promise();
        },
        
        saveKeysToSecureStorage: function () {
            var deferred = $.Deferred();
            SimpleCrypto.storage.put("encrypt.privateKey", keyCache.privateKey, 
                deferred.reject,
                function() {
                    SimpleCrypto.storage.put("encrypt.publicKey", keyCache.publicKey,
                        deferred.reject,
                        function() {
                        SimpleCrypto.storage.put("encrypt.publicJwk", keyCache.publicJwk,
                            deferred.reject,
                            deferred.resolve);                              
                        });
                });
            return deferred.promise();
        },
        
        hasKeys: function() {
            var deferred = $.Deferred();
            this.getKeys()
                .done(function(keys) {
                    deferred.resolve(true);
                })
                .fail(function() {
                    deferred.resolve(false);
                });
            return deferred.promise();
            
        },
        
        getKeys: function() {
            var deferred = $.Deferred();
            if (keyCache) {
                deferred.resolve({publicKey: keyCache.publicKey, privateKey: keyCache.privateKey, publicJwk: keyCache.publicJwk});
            }
            else {
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
                                        if (typeof publicKey === "undefined") {
                                            deferred.reject("publicJwk not found");
                                            return;
                                        }
                                        keyCache = {publicKey: publicKey, privateKey: privateKey, publicJwk: publicJwk};
                                        deferred.resolve(keyCache);
                                    });
                            });
                    });
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
                                deferred.resolve);
                        })
                });
            return deferred.promise();  
        },
        
    };
    return keys;
});