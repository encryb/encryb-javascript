define(["sjcl-worker/generalWorkerInclude"], function (WorkerManager) {
	"use strict";

	var entropyAvailable = true;

	function getEntropy() {
		try {
			var ab;

			// get cryptographically strong entropy depending on runtime environment
			if (window && Uint32Array) {
				ab = new Uint32Array(32);
				if (window.crypto && window.crypto.getRandomValues) {
					window.crypto.getRandomValues(ab);
				} else if (window.msCrypto && window.msCrypto.getRandomValues) {
					window.msCrypto.getRandomValues(ab);
				} else {
					return false;
				}

				// get cryptographically strong entropy in Webkit
				return ab;
			}
		} catch (e) {}

		return false;
	}

	var addEntropy = {
		setup: function (theWorker, callback) {
			var entropy = getEntropy();

			if (entropy) {
				theWorker.postMessage({randomNumber: entropy, entropy: 1024}, null, callback);
			} else {
				entropyAvailable = false;
			}
		}
	};

	var workers = new WorkerManager("sjcl-worker/sjclWorker", 2, addEntropy);

	var sjclWorker = {
		sym: {
			encrypt: function (key, message, callback) {
				workers.getFreeWorker(function (err, worker) {
					var data = {
						"key": key,
						"message": message,
						"encrypt": true
					};

					worker.postMessage(data, null, callback);
				});
			},
			decrypt: function (key, message, callback) {
				workers.getFreeWorker(function (err, worker) {
					var data = {
						"key": key,
						"message": message,
						"decrypt": true
					};

					worker.postMessage(data, null, callback);
				});
			}
		}
	};

	return sjclWorker;
});