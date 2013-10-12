var crypto = require('crypto')

module.exports = function(cb){
  crypto.randomBytes(48, function(err, buf) {   if(err)return cb&&cb(err)
    cb(null, buf.toString('base64') + Date.now())
  })
}