var Shoe = require('shoe')
var Datasource = require('json-context')

module.exports = function(datasourceOrToken, options){

  var datasource, token, requestAll = false

  if (typeof datasourceOrToken == 'string'){
    datasource = Datasource(options)
    token = datasourceOrToken
    requestAll = true
  } else if (datasourceOrToken.data.token) {
    datasource = datasourceOrToken
    token = datasource.data.token
  }

  if (datasource){
    
    var connection = Shoe(options.endpoint)
    connection.write(token + '\n')

    var changeStream = datasource.changeStream({verifiedChange: true})

    if (requestAll) changeStream.requestAll()
    connection.pipe(changeStream).pipe(connection)

    return datasource
  }
}