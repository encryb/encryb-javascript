define([
    'backbone',
    'sjcl',
    'app/services/dropbox',
    'app/encryption',
    'utils/data-convert',
    'utils/random'

], function (Backbone, Sjcl, Storage, Encryption, DataConvert, Random) {

    var FOLDER_POSTS = "posts/";

    var PostAdapter = {

        fetchPost: function(model, fullFetch) {

            var deferred = $.Deferred();

            var password = model.get('password');

            var deferredText = null;
            var deferredResizedImage = null;
            var deferredFullImage = null;

            if (model.get('textData') == null && model.get('hasText')) {
                deferredText = Storage.downloadUrl(model.get('textUrl'));
            }
            if (model.get('hasImage')) {
                if(model.get('resizedImageData') == null) {
                    deferredResizedImage = Storage.downloadUrl(model.get('resizedImageUrl'));
                }
                if(fullFetch && model.get('fullImageData') == null) {
                    deferredFullImage = Storage.downloadUrl(model.get('fullImageUrl'));
                }
            }

            $.when(deferredText, deferredResizedImage, deferredFullImage)
                .done(function (encryptedText, encryptedResizedImage, encryptedFullImage) {

                    var updates = {};

                    if(encryptedText != null) {
                        updates['textData'] = Encryption.decryptTextData(encryptedText, password);
                    }
                    if(encryptedResizedImage != null) {
                        var resizedImgDeferred = Encryption.decryptImageDataAsync(encryptedResizedImage, password);
                    }
                    if (encryptedFullImage != null) {
                        var fullImgDeferred = Encryption.decryptImageDataAsync(encryptedFullImage, password);
                    }
                    $.when(resizedImgDeferred, fullImgDeferred).done(function(resizedImage, fullImage) {
                        if (resizedImage) {
                            updates['resizedImageData'] = resizedImage;
                        }
                        if (fullImage) {
                            updates['fullImageData'] = fullImage;
                        }
                        model.set(updates);
                        deferred.resolve();
                    });
                });
            return deferred;
        },

        uploadPost: function (model) {

            var deferred = $.Deferred();

            var postId = Random.makeId();
            var password = Sjcl.random.randomWords(8,1);

            var text = model.get('textData');
            var encText = null;
            if (text) {
                encText = Encryption.encrypt(password,  "plain/text", text);
            }

            var resizedImage = model.get('resizedImageData');
            var encResizedImageDeferred = null;
            if (resizedImage) {
                var resizedImageDict = DataConvert.dataUriToTypedArray(resizedImage);
                encResizedImageDeferred = Encryption.encryptAsync(password, resizedImageDict['mimeType'], resizedImageDict['data'].buffer);
            }

            var image = model.get('fullImageData');
            var encImageDeferred = null;
            if (image) {
                var imageDict = DataConvert.dataUriToTypedArray(image);
                encImageDeferred = Encryption.encryptAsync(password, imageDict['mimeType'], imageDict['data'].buffer);
            }

            $.when(encResizedImageDeferred, encImageDeferred).done(function(encResizedImage, encImage) {
                $.when(Storage.uploadPost(FOLDER_POSTS + postId, encText, encResizedImage, encImage)).done(function (update) {
                    update['postId'] = postId;
                    update['password'] = Sjcl.codec.bytes.fromBits(password);
                    model.set(update);
                    deferred.resolve(model);
                });
            });
            return deferred;
        },

        deletePost: function(model) {
            Storage.remove(FOLDER_POSTS + model.get('postId'));
        }
    };
    return PostAdapter;
});