define(function(){
"use strict";

var TAG_DATA = "data:";
var TAG_BASE64 = ";base64,";
var REGEX_URI = /^data:(.*);base64,(.*)/;

var DataConvert = {

	typedArrayToDataUri : function (mimeType, typedArray) {
		var binary = '';
		var len = typedArray.byteLength;
		for (var i = 0; i < len; i++) {
			binary += String.fromCharCode(typedArray[i]);
		}
		var base64Data = btoa(binary);
		return TAG_DATA + mimeType + TAG_BASE64 + base64Data;
	},

	dataUriToTypedArray : function (dataURI) {
		var match = REGEX_URI.exec(dataURI);

		var dict = {};
		dict['mimeType'] = match[1];
		var raw = window.atob(match[2]);
		var rawLength = raw.length;
		var array = new Uint8Array(rawLength);

		for (var i = 0; i < rawLength; i++) {
			array[i] = raw.charCodeAt(i);
		}
		dict['data'] = array;
		return dict;
	},


	arrayToString : function (array) {

		return String.fromCharCode.apply(null, array);
	},

	stringToTypedArray : function (str) {
		var length = str.length;
		var buffer = new ArrayBuffer(length);
		var array = new Uint8Array(buffer);
		for (var i = 0; i < length; i++) {
			array[i] = str.charCodeAt(i);
		}
		return array;
	}
}

return DataConvert;
});