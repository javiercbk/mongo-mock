var _ = require('lodash');

var OperationResult = function () {
  this.ok = true;
  this.nInserted = 0;
  this.nUpdated = 0;
  this.nUpserted = 0;
  this.nModified = 0;
  this.nRemoved = 0;
  this._insertedIds = [];
  this._upsertedIds = [];
};

OperationResult.prototype.getInsertedIds = function () {
  return this._insertedIds;
};

OperationResult.prototype.getLastOp = function () {
  return null;
};

OperationResult.prototype.getUpsertedIdAt = function (index) {
  return _.get(this._upsertedIds, index);
};

OperationResult.prototype.getUpsertedIds = function () {
  return this._upsertedIds;
};

OperationResult.prototype.getWriteConcernError = function () {
  return null;
};

OperationResult.prototype.getWriteErrorAt = function () {
  return null;
};

OperationResult.prototype.getWriteErrorCount = function () {
  return 0;
};

OperationResult.prototype.getWriteErrors = function () {
  return [];
};

OperationResult.prototype.hasWriteErrors = function () {
  return false;
};

var BulkOperation = function (collection) {
  this.__collection__ = collection;
  this._operations = [];
  this._bulkResult = new OperationResult();
};

BulkOperation.prototype.execute = function (callback) {
  var self = this;
  var promises = [];
  var len = this._operations.length;
  for (var i = 0; i < len; i++) {
    var op = this._operations[i];
    promises.push(this.__collection__[op.method].apply(this.__collection__, op.args));
  }
  Promise.all(promises).then(function (results) {
    for (var i = 0; i < len; i++) {
      var _op = self._operations[i];
      switch (_op.method) {
        case 'insert':
          self._bulkResult.nInserted += 1;
          self._bulkResult._insertedIds.push(results[i]._id);
          break;
        case 'update':
          if (results[i].updatedExisting) {
            self._bulkResult.nUpdated += results[i].nUpdated;
          } else {
            self._bulkResult.nInserted += results[i].nInserted;
            self._bulkResult._upsertedIds.push(results[i]._id);
          }
          break;
        case 'remove':
          self._bulkResult.nRemoved += results[i].nRemoved;
          break;
        default:
          break;
      }
    }
    callback(null, self._bulkResult);
  }).catch(function (err) {
    callback(err);
  });
  if(typeof callback !== 'function') {
    return new Promise(function (resolve,reject) {
      callback = function (e, r) { e? reject(e) : resolve(r) };
    })
  }
};

BulkOperation.prototype.find = function (query) {
  var self = this;
  return {
    removeOne: function () {
      self._operations.push({ method: 'removeOne', args: [query].concat(Array.from(arguments)) });
    },
    remove: function () {
      self._operations.push({ method: 'remove', args: [query].concat(Array.from(arguments)) });
    },
    replaceOne: function () {
      self._operations.push({ method: 'replaceOne', args: [query].concat(Array.from(arguments)) });
    },
    updateOne: function () {
      self._operations.push({ method: 'updateOne', args: [query].concat(Array.from(arguments)) });
    },
    update: function () {
      self._operations.push({ method: 'update', args: [query].concat(Array.from(arguments)) });
    },
  };
};

BulkOperation.prototype.insert = function () {
  this._operations.push({ method: 'insert', args: Array.from(arguments) });
};

BulkOperation.prototype.update = function () {
  this._operations.push({ method: 'update', args: Array.from(arguments) });
};

BulkOperation.prototype.remove = function () {
  this._operations.push({ method: 'remove', args: Array.from(arguments) });
};

module.exports = BulkOperation;