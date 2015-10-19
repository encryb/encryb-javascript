(function (root, factory) {
  'use strict';

  if (typeof exports === 'object' && typeof require === 'function') {
    module.exports = factory(require('underscore'), require('backbone'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['underscore','backbone'], function(_, Backbone) {
      // Use global variables if the locals are undefined.
      return factory(_ || root._, Backbone || root.Backbone);
    });
  } else {
    // RequireJS isn't being used. Assume underscore and backbone are loaded in <script> tags
    factory(_, Backbone);
  }
}(this, function(_, Backbone) {
  'use strict';

  // A simple module to replace `Backbone.sync` to store data
  // in Dropbox Datastore.

  // Hold reference to Underscore.js and Backbone.js in the closure in order
  // to make things work even if they are removed from the global namespace

  // Our Store is represented by a single Dropbox.Datastore.Table. Create it
  // with a meaningful name. This name should be unique per application.
  Backbone.DropboxDatastore = function(name, options) {
    options = options || {};
    this.name = name;
    this.datastoreId = options.datastoreId || 'default';
    this._syncCollection = null;
  };

  // Instance methods of DropboxDatastore
  _.extend(Backbone.DropboxDatastore.prototype, Backbone.Events, {

    syncCollection: function(collection) {
      this._syncCollection = collection;
    },

    // Insert new record to *Dropbox.Datastore.Table*.
    create: function(model) {
      var createRecord = _.bind(this._createWithTable, this, model);

      return this.getTable()
        .then(createRecord)
        .then(_.bind(this.recordToJson, this));
    },

    // Update existing record in *Dropbox.Datastore.Table*.
    update: function(model) {
      var updateRecord = _.bind(this._updateWithTable, this, model);

      return this.getTable()
        .then(updateRecord)
        .then(_.bind(this.recordToJson, this));
    },

    // Find record from *Dropbox.Datastore.Table* by id.
    find: function(model) {
      var findRecord = _.bind(this._findWithTable, this, model),
          throwIfNotFound = this._throwIfNotFound;

      return this.getTable()
        .then(findRecord)
        .then(throwIfNotFound)
        .then(_.bind(this.recordToJson, this));
    },

    // Find all records currently in *Dropbox.Datastore.Table*.
    findAll: function() {
      var findAllRecords = _.bind(this._findAllWithTable, this);

      return this.getTable()
        .then(findAllRecords);
    },

    // Remove record from *Dropbox.Datastore.Table*.
    destroy: function(model) {
      var destroyRecord = _.bind(this._destroyWithTable, this, model);

      return this.getTable()
        .then(destroyRecord);
    },

    // lazy table getter
    getTable: function() {
      if (!this._tablePromise) {
        this._tablePromise = this._createTablePromise();
      }

      return this._tablePromise;
    },


    getStatus: function() {
      if (this._table && this._table._datastore.getSyncStatus().uploading) {
        return 'uploading';
      } else {
        return 'synced';
      }
    },

    close: function() {
      if (this._table) {
        this._stopListenToChangeStatus(this._table._datastore);
        this._stopListenToChangeRecords(this._table._datastore);
      }
    },

    _createTablePromise: function() {
      return Backbone.DropboxDatastore.getDatastore(this.datastoreId).then(_.bind(function(datastore) {
        var table = datastore.getTable(this.name);
        this._startListenToChangeStatus(datastore);
        this._startListenToChangeRecords(datastore);
        this._table = table;
        return table;
      }, this));
    },

    _createWithTable: function(model, table) {
      var deferred = Backbone.$.Deferred();
      
      Backbone.$.when(this.modelToJson(model)).done(function(json) {
        deferred.resolve(table.insert(json)); 
      });
      
      return deferred.promise();
      
    },

    _updateWithTable: function(model, table) {
      var deferred = Backbone.$.Deferred();
        
      var record = this._findWithTable(model, table);
      Backbone.$.when(this.modelToJson(model)).done(function(json) {
        if (record) {
          record.update(json);
        } else {
          record = table.insert(json);
        }
        deferred.resolve(record);
      });
      
      return deferred.promise();
    },

    _findWithTable: function(model, table) {
        var params = {},
            record;
        if (model.isNew()) {
          throw new Error('Cannot fetch data for model without id');
        } else {
          if (model.idAttribute === 'id') {
            record = table.get(model.id);
          } else {
            params[model.idAttribute] = model.id;
            record = _.first(table.query(params));
          }

          return record;
        }
    },

    _findAllWithTable: function(table) {
      var deferred = Backbone.$.Deferred();
      
      var query = table.query();
      
      var deferreds = [];
      for (var i=0; i<query.length; i++) {
        deferreds.push(this.recordToJson(query[i]));
      }
      
      Backbone.$.when.apply(null, deferreds).done(function () {
        deferred.resolve(Backbone.$.makeArray(arguments));
      });
      return deferred;
    },

    _destroyWithTable: function(model, table) {
      var record = this._findWithTable(model, table);
      if (record) {
        record.deleteRecord();
      }
      return {};
    },

    _throwIfNotFound: function(record) {
      if (!record) {
        throw new Error('Record not found');
      }

      return record;
    },

    _startListenToChangeStatus: function(datastore) {
      this._changeStatusListener = _.bind(this._onChangeStatus, this);
      datastore.syncStatusChanged.addListener(this._changeStatusListener);
    },

    _startListenToChangeRecords: function(datastore) {
      this._changeRecordsListener = _.bind(this._onChangeRecords, this);
      datastore.recordsChanged.addListener(this._changeRecordsListener);
    },

    _stopListenToChangeStatus: function(datastore) {
      if (this._changeStatusListener) {
        datastore.syncStatusChanged.removeListener(this._changeStatusListener);
        delete this._changeStatusListener;
      }
    },

    _stopListenToChangeRecords: function(datastore) {
      if (this._changeRecordsListener) {
        datastore.recordsChanged.removeListener(this._changeRecordsListener);
        delete this._changeRecordsListener;
      }
    },

    _onChangeStatus: function() {
      this.trigger('change:status', this.getStatus(), this);
    },

    _onChangeRecords: function(changes) {
      if (this._syncCollection) {
        Backbone.DropboxDatastore.getChangesForTable(this.name, changes, _.bind(this.recordToJson, this))
          .done(_.bind(function(changedRecords) {
            // Update collection deferred to prevent double copy of same model in local collection
            _.defer(Backbone.DropboxDatastore.updateCollectionWithChanges, this._syncCollection, changedRecords);
          }, this));
        }
    },

    recordToJson: function(record) {
      return Backbone.DropboxDatastore.recordToJson(record);
    },

    modelToJson: function(model) {
      return model.toJSON();
    }


  });

  // Static methods of DropboxDatastore
  _.extend(Backbone.DropboxDatastore, {

    _datastorePromises: {},

    getDatastore: function(datastoreId) {
      var datastorePromise = this._datastorePromises[datastoreId];

      if (!datastorePromise) {
        datastorePromise = this._createDatastorePromise(datastoreId);
        this._datastorePromises[datastoreId] = datastorePromise;
      }

      return datastorePromise;
    },

    createSharedDatastore: function() {
      var defer = Backbone.$.Deferred();

       this.getDatastoreManager().createDatastore(_.bind(function(error, datastore) {
         if (error) {
           defer.reject(error);
         }
         else {
           datastore.setRole("public", "viewer");

             this._datastorePromises[datastore.getId()] = defer;
             defer.resolve(datastore);
           }
        }, this));

        return defer;
    },
    deleteDatastore: function(datastoreId) {
        delete this._datastorePromises[datastoreId];
        this.getDatastoreManager().deleteDatastore(datastoreId, function (error) {
            if (error) {
                throw error;
            }
        });
    },

    _createDatastorePromise: function(datastoreId) {
      var defer = Backbone.$.Deferred();

      if (datastoreId[0] == (".")) {
          this.getDatastoreManager().openDatastore(datastoreId, _.bind(function (error, datastore) {
              if (error) {
                  defer.reject(error);
              } else {
                  defer.resolve(datastore);
              }
          }, this));
      }
      else {
          this.getDatastoreManager()._getOrCreateDatastoreByDsid(datastoreId, _.bind(function (error, datastore) {
              if (error) {
                  defer.reject(error);
              } else {
                  defer.resolve(datastore);
              }
          }, this));
      }

      return defer.promise();
    },

    getDatastoreManager: function() {
      return this.getDropboxClient().getDatastoreManager();
    },

    getDropboxClient: function() {
      var client = Backbone.DropboxDatastore.client;
      if (!client) {
        throw new Error('Client should be defined for Backbone.DropboxDatastore');
      }
      if (!client.isAuthenticated()) {
        throw new Error('Client should be authenticated for Backbone.DropboxDatastore');
      }
      return client;
    },

    // Using to convert returned Dropbox Datastore records to JSON
    recordToJson: function(record) {
      var fields = record.getFields();

      var json = {};
      _.each(fields, function(field, key) {
          if (field instanceof Backbone.Dropbox.Datastore.List) {
              json[key] = field.toArray();
          }
          else {
              json[key] = field;
          }
      });
      return _.extend(json, {
        id: record.getId()
      });
    },

    getChangesForTable: function(tableName, changes, convertRecord) {
      
      var deferred = Backbone.$.Deferred();
      
      var records = {
        toRemove: [],
        toAdd: []
      };
      
      var deferreds = [];

      _.each(changes.affectedRecordsForTable(tableName), function(changedRecord) {
        if (changedRecord.isDeleted()) {
          records.toRemove.push(changedRecord.getId());
        } else {
          deferreds.push(convertRecord(changedRecord));
        }
      });
      
      Backbone.$.when.apply(null, deferreds).done(function () {
        records.toAdd = Backbone.$.makeArray(arguments);
        deferred.resolve(records);
      });

      return deferred;
    },

    updateCollectionWithChanges: function(syncCollection, changedRecords) {
      syncCollection.add(changedRecords.toAdd, {merge: true});
      syncCollection.remove(changedRecords.toRemove);
    },

    // dropboxDatastoreSync delegate to the model or collection's
    // *dropboxDatastore* property, which should be an instance of `Backbone.DropboxDatastore`.
    sync: function(method, model, options) {
      var callSuccessHandler = _.partial(Backbone.DropboxDatastore._callSuccessHandler, model, options);

      return Backbone.DropboxDatastore._doSyncMethod(model, method)
        .then(callSuccessHandler);
    },

    _doSyncMethod: function(model, method) {
      var store = Backbone.DropboxDatastore._getStoreFromModel(model);
      switch (method) {
        case 'read':   return (model instanceof Backbone.Collection ? store.findAll() : store.find(model));
        case 'create': return store.create(model);
        case 'update': return store.update(model);
        case 'delete': return store.destroy(model);
        default: throw new Error('Incorrect Sync method');
      }
    },

    _getStoreFromModel: function(model) {
      return model.dropboxDatastore || model.collection.dropboxDatastore;
    },

    _callSuccessHandler: function(model, options, resp) {
      if (options && options.success) {
        if (Backbone.VERSION === '0.9.10') {
          options.success(model, resp, options);
        } else {
          options.success(resp);
        }
      }
      return resp;
    }
  });

  Backbone.originalSync = Backbone.sync;

  // Override 'Backbone.sync' to default to dropboxDatastoreSync,
  // the original 'Backbone.sync' is still available in 'Backbone.originalSync'
  Backbone.sync = function(method, model, options) {
    if(model.dropboxDatastore || (model.collection && model.collection.dropboxDatastore)) {
      return Backbone.DropboxDatastore.sync(method, model, options);
    } else {
      return Backbone.originalSync(method, model, options);
    }
  };

  return Backbone.DropboxDatastore;
}));
