define([
    'sjcl',
    'sjcl-worker/sjclWorkerInclude',
    'utils/data-convert',
    'utils/encoding',
    'utils/sjcl-convert'
], function(Sjcl, SjclWorker, DataConvert, Encoding, SjclConvert){

    var exports = {};

    var _OLD_KEY = "global";


    exports.encrypt = function(key, mimeType, data, isBinary) {
        if (isBinary) {
            data = Sjcl.codec.bytes.toBits(data);
        }
        var encrypted = Sjcl.json._encrypt(key, data);

        var encryptedData = SjclConvert.convertFromBits(encrypted);
        encryptedData['mimeType'] = mimeType;

        var buf = Encoding.encode(encryptedData);

        return buf;
    };

    exports.encryptAsync = function(key, mimeType, data) {
        var deferred = $.Deferred();
        SjclWorker.sym.encrypt(data, mimeType, key, function(error, encrypted) {
            deferred.resolve(encrypted.packedData);
        });
        return deferred.promise();
    },

    exports.encryptWithEcc = function(keyString, mimeType, data, isBinary) {
        if(keyString) {
            var key = exports.publicHexToKey(keyString);
        }
        else {
            var key = _OLD_KEY;
        }
        return exports.encrypt(key, mimeType, data, isBinary);
    };

    exports.createKeys = function() {
        var keys = Sjcl.ecc.elGamal.generateKeys(384);

        var publicKey = keys.pub.get();
        var secretKey = keys.sec.get();

        var publicKeyEncoded = Sjcl.codec.hex.fromBits(publicKey.x) + Sjcl.codec.hex.fromBits(publicKey.y);
        var secretKeyEncoded = Sjcl.codec.hex.fromBits(secretKey);
        exports.saveKeys(secretKeyEncoded, publicKeyEncoded);
    }

    exports.saveKeys = function(secretKeyEncoded, publicKeyEncoded) {
        localStorage.setItem("secretKey", secretKeyEncoded);
        localStorage.setItem("publicKey", publicKeyEncoded);

    }


    exports.removeKeys = function() {
        localStorage.removeItem("secretKey");
        localStorage.removeItem("publicKey");
    };

    exports.publicHexToKey = function(publicKeyEncoded) {

        var publicKeyBits = Sjcl.codec.hex.toBits(publicKeyEncoded);
        var publicKey = new Sjcl.ecc.elGamal.publicKey(Sjcl.ecc.curves.c384, publicKeyBits);

        return publicKey;
    };

    exports.secretHexToKey = function(secretKeyEncoded) {
        var secretKeyBits = new Sjcl.bn(secretKeyEncoded);
        var secretKey = new Sjcl.ecc.elGamal.secretKey(Sjcl.ecc.curves.c384, secretKeyBits);
        return secretKey;

    };

    exports.getKeys = function() {
        var secretKeyEncoded = localStorage.getItem("secretKey");
        var publicKeyEncoded = localStorage.getItem("publicKey");

        if (secretKeyEncoded === null || publicKeyEncoded === null ) {
            return null;
        }

        return {
            publicKey: exports.publicHexToKey(publicKeyEncoded),
            secretKey: exports.secretHexToKey(secretKeyEncoded)
        };
    };

    exports.getEncodedKeys = function() {
        var secretKeyEncoded = localStorage.getItem("secretKey");
        var publicKeyEncoded = localStorage.getItem("publicKey");
        return {
            publicKey: publicKeyEncoded,
            secretKey: secretKeyEncoded
        };

    };

    function decrypt(data, password) {

        var encData = SjclConvert.convertToBits(data);
        if (password instanceof Array) {
            password = Sjcl.codec.bytes.toBits(password);
        }
        var ct = Sjcl.json._decrypt(password, encData);

        return ct;
    }

    exports.decryptImageData = function(packedData, password) {
        var data = Encoding.decode(packedData);
        var ct = decrypt(data, password);
        var decrypted = Sjcl.codec.arrayBuffer.fromBits(ct);
        var imageData = "data:" +  data.mimeType + ";base64," + DataConvert.arrayToBase64(decrypted);
        return imageData;
    }

    exports.decryptImageDataAsync = function(password, packedData) {
        var deferred = $.Deferred();

        SjclWorker.sym.decrypt(packedData, password, function(error, decrypted) {
            var imageData = "data:" +  decrypted.mimeType + ";base64,"+ DataConvert.arrayToBase64(decrypted.data);
            deferred.resolve(imageData);
        });

        return deferred.promise();
    }

    exports.decryptTextData = function(packedData, password) {
        var data = Encoding.decode(packedData);
        var ct = decrypt(data, password);
        var decrypted = Sjcl.codec.utf8String.fromBits(ct);

        return decrypted;
    }

    // $TODO, fake for now
    exports.decryptTextDataAsync = function(password, packedData) {
        var deferred = $.Deferred();
        var decrypted = exports.decryptTextData(packedData, password);
        deferred.resolve(decrypted);
        return deferred.promise();
    }

    return exports;
});