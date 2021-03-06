var sift = require('sift');
var ObjectId = require('mongodb').ObjectID;

//use a custom compare function so we can search on ObjectIDs
var compare = sift.compare;
sift.compare = function(a, b) {
  if(a && b && a._bsontype && b._bsontype) {
    return a.equals(b) ? 0 : -1;
  }
  return compare(a,b);
};
function time(id) {
  return id.getTimestamp().getTime()
}

module.exports = sift;
