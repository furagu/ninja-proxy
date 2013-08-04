var http = require('http'),
    util = require('util'),
    events = require("events"),
    sys = require('sys'),
    url = require('url'),
    buffertools = require('buffertools'),
    _ = require('underscore'),
    ProxyList = require('./lib/proxy-list.js')


var proxies = ProxyList(__dirname + '/proxies.txt')

http.createServer(function(request, response) {
    var sr = StoredRequest(request)

    sr.on('ready', function () {
        this.requestWith(proxies, function (res) {
            response.writeHead(res.statusCode, res.headers)
            res.pipe(response)
        })
    })
}).listen(8080)

function StoredRequest(request) {
    if (!(this instanceof StoredRequest)) return new StoredRequest(request)
    var that = this
    _.extend(this, _.pick(request, 'url', 'method', 'headers'))
    this.body = new Buffer(0)
    request.on('data', function (chunk) {
        that.body = that.body.concat(chunk)
    })
    request.on('end', function () {
        that.emit('ready')
    })
}
util.inherits(StoredRequest, events.EventEmitter)

StoredRequest.prototype.requestWith = function (proxies, callback) {
    var options, request, proxy

    proxy = proxies.fetch()

    options = {
        host: proxy.ip,
        port: proxy.port,
        path: this.url,
        method: this.method,
        headers: this.headers,
    }

    request = http.request(options, callback)
    request.write(this.body)
    request.end()
}


// 424 Failed Dependency
