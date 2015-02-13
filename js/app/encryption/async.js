define([
    'sjcl',
    'app/encryption/sjcl-convert',
    'app/encryption/webworker/sjclMainThread',
    'compat/windowUrl',
    'utils/data-convert',
    'utils/encoding'
], function(Sjcl, SjclConvert, SjclWorker, WindowUrl, DataConvert, Encoding){

    var async = {
        /** Encrypt a binary array or a string.
         * @param {String|bitArray} key The password or key.
         * @param {String} mimeType Mime Type of data or null.
         * @param {String|Array} [data] Data to encrypt.
         * @param {Boolean} [isBinary] If data is string or a binary array.
         * @return {ArrayBuffer} ArrayBuffer of encrypted data.
         */

        encrypt: function(key, mimeType, data, isBinary) {
            var deferred = $.Deferred();
            SjclWorker.sym.encrypt(data, mimeType, key, isBinary, function(error, encrypted) {
                deferred.resolve(encrypted.packedData);
            });
            return deferred.promise();
        },
    
        decryptData: function(password, packedData) {
            var deferred = $.Deferred();
    
            SjclWorker.sym.decrypt(packedData, true, password, function(error, decrypted) {
                if (error) {
                    deferred.reject(error.message);
                }
                else {
                    var blob = new Blob([decrypted.data], {type: decrypted.mimeType});
                    var objectUrl = WindowUrl.createObjectURL(blob);
                    deferred.resolve(objectUrl);
                }
            });
    
            return deferred.promise();
        },
    
    
        decryptArray: function(password, packedData) {
            var deferred = $.Deferred();
    
            SjclWorker.sym.decrypt(packedData, true, password, function(error, decrypted) {
                if (error) {
                    deferred.reject(error.message);
                    return;
                }
    
                var datas = Encoding.splitBuffers(decrypted.data);
                if (!datas) {
                    deferred.reject("Could not split assets");
                    return;
                }
                var objects =[];
                for(var i=0; i<datas.length; i++) {
                    var data = datas[i];
                    var blob = new Blob([data], {type: decrypted.mimeType});
                    var objectUrl = WindowUrl.createObjectURL(blob);
                    objects.push(objectUrl);
                }
                deferred.resolve(objects);
            });
    
            return deferred.promise();
        },

        decryptText: function(password, packedData) {
            var deferred = $.Deferred();
            SjclWorker.sym.decrypt(packedData, false, password, function(error, decrypted) {
                if (error) {
                    deferred.reject(error.message);
                }
                else if (decrypted.error) {
                    deferred.reject(decrypted.error)
                }
                else {
                    deferred.resolve(decrypted.data);
                }
            });
            return deferred.promise();
        }
    }

    return async;
});