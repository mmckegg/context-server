var crypto = require('crypto')

var keys = []

module.exports = function(){
  // avoid callbacks by pregenerating keys
  if (keys.length < 100) generate(100 - keys.length)
  if (keys.length == 0) throw 'Ran out of keys, wait a few milliseconds and try again'
  return keys.pop() + Date.now()
}

function generate(count){
  for (var i=0;i<count;i++){
    crypto.randomBytes(48, function(err, buf) {
      if (buf){
        keys.push(buf.toString('base64'))
      }
    })
  }
}

generate(100)