define([
	"sjcl",
	"utils/encoding",
	"utils/sjcl-convert"
	],
function (Sjcl, Encoding, SjclConvert) {
	"use strict";

	function decrypt(packedData, isBinary, password) {
		var data = Encoding.decode(packedData);
		var encData = SjclConvert.convertToBits(data);
		if (password instanceof Array) {
			password = Sjcl.codec.bytes.toBits(password);
		}
        else if (password.hasOwnProperty("privateKey")) {
            var secretKeyBits = new Sjcl.bn(password.privateKey);
            password = new Sjcl.ecc.elGamal.secretKey(Sjcl.ecc.curves.c384, secretKeyBits);
        }
		var ct = Sjcl.json._decrypt(password, encData);
        var decrypted;
        if (isBinary) {
            decrypted = Sjcl.codec.arrayBuffer.fromBits(ct);
            return {value: {mimeType: data.mimeType, data: decrypted}, transferable: [decrypted]};
        }
        else {
            try {
                decrypted = Sjcl.codec.utf8String.fromBits(ct);
                return {value: {data: decrypted}, transferable: []};
            }
            catch (e) {
                return {value: {error: "Could not convert decrypted data to string " + e.message}, transferable: []};
            }
        }
	}

	function encrypt(content, mimeType, password) {
		var data = Sjcl.codec.bytes.toBits(new Uint8Array(content));
		var encrypted = Sjcl.json._encrypt(password, data);
		var encryptedData = SjclConvert.convertFromBits(encrypted);
		encryptedData['mimeType'] = mimeType;

		var packedData = Encoding.encode(encryptedData);

		return {value : {packedData: packedData}, transferable: [packedData]};
	}

	return function (event) {
		if (event.data.randomNumber) {
			Sjcl.random.addEntropy(event.data.randomNumber, event.data.entropy, "adding entropy");
			return "entropy";
		}

		if (event.data.encrypt) {
			return encrypt(event.data.content, event.data.mimeType, event.data.password);
		} else if (event.data.decrypt) {
			return decrypt(event.data.encryptedContent, event.data.isBinary, event.data.password);
		}
		return false;
	};
});