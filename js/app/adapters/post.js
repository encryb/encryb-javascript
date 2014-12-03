define([
    'backbone',
    'sjcl',
    'app/services/dropbox',
    'app/encryption',
    'utils/data-convert',
    'utils/random'

], function (Backbone, Sjcl, Storage, Encryption, DataConvert, Random) {

    var FOLDER_POSTS = "posts/";

    function _uploadContent(content, password, folderId, contentNumber) {

        var deferred = $.Deferred();

        var text = content.textData;
        var resizedImage = content.resizedImageData;
        var image = content.fullImageData;

        var encText = null;
        if (text) {
            encText = Encryption.encrypt(password,  "plain/text", text);
        }

        var encResizedImageDeferred = null;
        if (resizedImage) {
            var resizedImageDict = DataConvert.dataUriToTypedArray(resizedImage);
            encResizedImageDeferred = Encryption.encryptAsync(password, resizedImageDict['mimeType'], resizedImageDict['data'].buffer);
        }

        var encImageDeferred = null;
        if (image) {
            var imageDict = DataConvert.dataUriToTypedArray(image);
            encImageDeferred = Encryption.encryptAsync(password, imageDict['mimeType'], imageDict['data'].buffer);
        }

        $.when(encResizedImageDeferred, encImageDeferred).done(function(encResizedImage, encImage) {
            $.when(Storage.uploadPost(FOLDER_POSTS + folderId, contentNumber, encText, encResizedImage, encImage)).done(function (result) {
                $.extend(content, result);
                deferred.resolve();
            });
        });
        return deferred.promise();
    };

    var setImage = function (content, resizedImage) {
        var deferred = $.Deferred();
        content.set("resizedImageData", resizedImage);

        var img = new Image();
        img.onload = function () {
            content.resizedWidth = this.width;
            content.resizedHeight = this.height;
            deferred.resolve();
        }
        img.src = resizedImage;

        return deferred.promise();
    }



    var PostAdapter = {

        fetchPost: function(model) {

            var deferred = $.Deferred();
            var password = model.get('password');
            var deferreds = [];

            if (model.get('textData') == null && model.has('textUrl')) {
                var textDeferred = Storage.downloadUrl(model.get('textUrl'))
                    .then(function(encryptedText){
                        var deferred = $.Deferred();
                        model.set("textData", Encryption.decryptTextData(encryptedText, password));
                        deferred.resolve();
                        return deferred.promise();
                    });
                deferreds.push(textDeferred);
            }

            if (model.has("content")) {

                var content = model.get('content');
                content.each(function (c) {
                    if (!c.has('textData') && c.has("textUrl")) {
                        var textUrl = c.get('textUrl');
                        var textDeferred = Storage.downloadUrl(textUrl)
                            .then(function(encryptedData) {
                                var deferred = $.Deferred();
                                var decrypted = Encryption.decryptTextData(encryptedData, password);
                                c.set("textData", decrypted);
                                deferred.resolve();
                                return deferred.promise();
                            });
                        deferreds.push(textDeferred);
                    }
                    if (!c.has('resizedImageData') && c.has("resizedImageUrl")) {
                        var resizedImageUrl = c.get('resizedImageUrl');
                        var resizedImageDeferred = Storage.downloadUrl(resizedImageUrl)
                            .then(Encryption.decryptImageDataAsync.bind(null, password))
                            .then(setImage.bind(null, c));

                        deferreds.push(resizedImageDeferred);
                    }
                    c.getFullImage = function () {
                        var deferred = $.Deferred();
                        if (c.has("fullImageData")) {
                            deferred.resolve(c.get("fullImageData"));
                        }
                        else {
                            var fullImageUrl = c.get('fullImageUrl');
                            Storage.downloadUrl(fullImageUrl)
                                .then(Encryption.decryptImageDataAsync.bind(null, password))
                                .done(function (fullImage) {
                                    c.set('fullImageData', fullImage);
                                    deferred.resolve(fullImage);
                                });
                        }
                        return deferred.promise();
                    }
                });
            }

            $.when.apply($, deferreds).done(function() {
                deferred.resolve();
            });

            return deferred.promise();
        },

        uploadPost: function(postMeta, images) {
            var deferred = $.Deferred();

            var password = Sjcl.random.randomWords(8,1);
            var folderId = Random.makeId();

            $.when(Storage.createFolder(FOLDER_POSTS + folderId)).done( function () {
                var uploads = [];
                for (var i = 0; i < images.length; i++) {
                    var image = images[i];
                    var upload = _uploadContent(image, password, folderId, i);
                    uploads.push(upload);
                }

                $.when.apply($, uploads).done(function () {
                    postMeta["password"] = Sjcl.codec.bytes.fromBits(password);
                    postMeta["folderId"] = folderId;
                    console.log("UploadPost", JSON.stringify(postMeta));
                    deferred.resolve(postMeta, images);
                });
            });

            return deferred;
        },

        deletePost: function(model) {
            Storage.remove(FOLDER_POSTS + model.get('folderId'));
        }
    };
    return PostAdapter;
});