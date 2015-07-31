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
        
        importKeys: function(publicJwk, privateJwk) {
            var deferred = $.Deferred;            
            SimpleCrypto.asym.importEncryptionKey(publicJwk, privateJwk, deferred.reject, deferred.resolve);
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
            SimpleCrypto.storage.delete("privateEncrypt", 
                deferred.reject,
                function() {
                    SimpleCrypto.storage.delete("publicEncrypt",
                        deferred.reject,
                        function() {
                            SimpleCrypto.storage.delete("publicEncryptJWK",
                                deferred.reject,
                                deferred.resolve);
                        })
                });
            return deferred.promise();  
        },
        
    };
    return keys;
});