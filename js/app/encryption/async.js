define([
    'jquery',
    'simplecrypto',
    'compat/windowUrl',
    'utils/data-convert',
    'utils/encoding'
], function($, SimpleCrypto, WindowUrl, DataConvert, Encoding){

    var async = {
        /** Encrypt a binary array or a string.
         * @param {String|bitArray} key The password or key.
         * @param {String} mimeType Mime Type of data or null.
         * @param {String|Array} [data] Data to encrypt.
         * @param {Boolean} [isBinary] If data is string or a binary array.
         * @return {ArrayBuffer} ArrayBuffer of encrypted data.
         */

        encrypt: function(keys, mimeType, data, isBinary) {
            var deferred = $.Deferred();
            
            if (!isBinary) {
                data = SimpleCrypto.util.stringToBytes(data);
            }
            
            SimpleCrypto.sym.encrypt(keys, data, 
                function(error) {
                    deferred.reject(error);
                },
                function(result) {
                    result.mimeType = SimpleCrypto.util.stringToBytes(mimeType).buffer;
                    try {
                        var encoded = SimpleCrypto.pack.encode(result);
                        deferred.resolve(encoded);
                    }
                    catch(e) {
                        deferred.reject(e.message);
                    }
                }
            )
            return deferred.promise();
        },
               
        decryptData: function(keys, packedData) {
            var deferred = $.Deferred();
    
            var decoded = SimpleCrypto.pack.decode(packedData);
            SimpleCrypto.sym.decrypt(keys, decoded,
                function(error) {
                    deferred.reject(error);
                },
                function(decrypted) {
                    try {
                        var mimeType = SimpleCrypto.util.bytesToString(decoded.mimeType);
                        var blob = new Blob([decrypted], {type: mimeType});
                        var objectUrl = WindowUrl.createObjectURL(blob);
                        deferred.resolve(objectUrl, mimeType);
                    }
                    catch(e) {
                        deferred.reject(e.message);
                    }
                }
            )
    
            return deferred.promise();
        },
    
    
        decryptArray: function(keys, packedData) {
            var deferred = $.Deferred();
    
            var decoded = SimpleCrypto.pack.decode(packedData);
            SimpleCrypto.sym.decrypt(keys, decoded,
                function(error) {
                    deferred.reject(error);
                },
                function(decrypted) {
                    try {
                        var mimeType = SimpleCrypto.util.bytesToString(decoded.mimeType);
                        var datas = Encoding.splitBuffers(decrypted);
                        if (!datas) {
                            deferred.reject("Could not split assets");
                            return;
                        }
                        var objects =[];
                        for(var i=0; i<datas.length; i++) {
                            var data = datas[i];
                            var blob = new Blob([data], {type: mimeType});
                            var objectUrl = WindowUrl.createObjectURL(blob);
                            objects.push(objectUrl);
                        }
                        deferred.resolve(objects, mimeType);
                    }
                    catch(e) {
                        deferred.reject(e.message);
                    }
                }
            )    
            return deferred.promise();
        },

        decryptText: function(keys, packedData) {
            var deferred = $.Deferred();
            
            var decoded = SimpleCrypto.pack.decode(packedData);
            SimpleCrypto.sym.decrypt(keys, decoded,
                function(error) {
                    deferred.reject(error);
                },
                function(decrypted) {
                    try {
                        var mimeType = SimpleCrypto.util.bytesToString(decoded.mimeType);
                        var text = SimpleCrypto.util.bytesToString(decrypted);
                        deferred.resolve(text, mimeType);
                    }
                    catch(e) {
                        deferred.reject(e.message);
                    }
                }
            )
            
            return deferred.promise();
        },
        asymEncryptText: function(key, mimeType, text) {
          
            var deferred = $.Deferred();
            
            var data = SimpleCrypto.util.stringToBytes(text);
            
            SimpleCrypto.asym.encrypt(key, data, 
                function(error) {
                    deferred.reject(error);
                },
                function(result) {
                    result.mimeType = SimpleCrypto.util.stringToBytes(mimeType).buffer;
                    try {
                        var encoded = SimpleCrypto.pack.encode(result);
                        deferred.resolve(encoded);
                    }
                    catch(e) {
                        deferred.reject(e.message);
                    }
                }
            )
            return deferred.promise();
        
        },
        
        asymEncryptTextWithJwk: function(jwk, mimeType, packedData) {
            
            debugger;
            var deferred = $.Deferred();
            SimpleCrypto.asym.importEncryptPublicKey(jwk,
                deferred.reject,
                function(key) {
                    async.asymEncryptText(key, mimeType, packedData).done(deferred.resolve).fail(deferred.reject);    
                });
            return deferred.promise();
                
        },
        
        asymDecryptText: function(key, packedData) {
        
            var deferred = $.Deferred();
            
            var decoded = SimpleCrypto.pack.decode(packedData);
            SimpleCrypto.asym.decrypt(key, decoded,
                deferred.reject,
                function(decrypted) {
                    try {
                        var mimeType = SimpleCrypto.util.bytesToString(decoded.mimeType);
                        var text = SimpleCrypto.util.bytesToString(decrypted);
                        deferred.resolve(text, mimeType);
                    }
                    catch(e) {
                        deferred.reject(e.message);
                    }
                });
            return deferred.promise();
            
        }
    }
    

    return async;
});