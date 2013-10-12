var Shoe = require('shoe')
var EventEmitter = require('events').EventEmitter
var generateKey = require('./generate_key')

module.exports = function(server, options){

  options = extend({
    unusedTimeout: 5000,
    endpoint: '/contexts'
  }, options)

  var contextServer = new EventEmitter()
  var userDatasources = {}

  var unused = {}

  var destroyUnusedTimer = options.unusedTimeout && setInterval(function(){
    Object.keys(unused).forEach(function(key){
      var datasource = userDatasources[key]
      if (datasource.timeout < Date.now()){
        datasource.destroy()
        contextServer.emit('destroy', datasource)
        delete userDatasources[datasource.data.token]
        delete unused[datasource.data.token]
      }
    })
  }, options.unusedTimeout)

  server.on('close', function(){
    contextServer.destroy()
  })

  contextServer.destroy = function(){
    clearInterval(destroyUnusedTimer)
    Object.keys(unused).forEach(function(key){
      var datasource = userDatasources[key]
      datasource.destroy()
      delete unused[key]
      delete userDatasources[key]
    })
    contextServer.sockets.destroy()
    contextServer.removeAllListeners()
    contextServer.emit('end')
  }

  contextServer.add = function(datasource, cb){
    generateKey(function(err, token){ if(err)return cb&&cb(err)
      datasource.data.token = token
      userDatasources[token] = datasource
      unuse(datasource)
      cb(null, token)
    })
  }

  contextServer.generateKey = generateKey

  function use(key){
    delete unused[key]
  }

  function unuse(datasource){
    datasource.timeout = Date.now() + options.unusedTimeout
    unused[datasource.data.token] = datasource
  }

  contextServer.sockets = Shoe(function (stream) {

    var datasource = null

    stream.once('data', function(data){
      var token = data.toString().trim()

      datasource = userDatasources[token]
      if (datasource){
        use(token)
        stream.pipe(datasource.changeStream()).pipe(stream)
        contextServer.emit('connect', stream, datasource)
      } else {
        stream.close()
      }
    })

    stream.once('end', function () {
      if (datasource){
        unuse(datasource)
        contextServer.emit('disconnect', stream, datasource)
      }
    });

  }).install(server, options.endpoint)

  return contextServer
}

function extend(args){
  var result = {}
  for (var i=0;i<arguments.length;i++){
    var obj = arguments[i]
    if (obj){
      Object.keys(obj).forEach(function(key){
        result[key] = obj[key]
      })
    }
  }
  return result
}