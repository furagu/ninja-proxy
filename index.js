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
    ProxyRequest(request, response, proxies)
        .on('error', function (error) {
            response.writeHead(424, 'Proxying Failed', {'Content-Type': 'text/plain'})
            response.write(error.toString() + '\n')
            response.end()
        })
}).listen(8080)

function ProxyRequest(orig_request, orig_response, proxy_list) {
    if (!(this instanceof ProxyRequest)) return new ProxyRequest(orig_request, orig_response, proxy_list)
    this.save_request(orig_request, function (request) {
        this.proxy_request(request, proxy_list, function (response) {
            this.pipe_response(response, orig_response)
        })
    })
}
util.inherits(ProxyRequest, events.EventEmitter)

ProxyRequest.prototype.save_request = function (request, callback) {
    var saved_request = {
        headers: request.headers,
        method:  request.method,
        path:    request.url,
        body:    new Buffer(0),
    }
    request.on('data', function (chunk) {
        saved_request.body = saved_request.body.concat(chunk)
    })
    request.on('end', _.bind(callback, this, saved_request))
    request.on('error', _.bind(this.emit, 'error'))
}

ProxyRequest.prototype.proxy_request = function (saved_request, proxy_list, callback) {
    var used_proxies = [],
        that = this,
        proxy
    ;(function make_request () {
        proxy = proxy_list.fetch(used_proxies)
        console.log('%s via %s', saved_request.path, proxy)
        var request = http.request(_.extend(saved_request, proxy), function (response) {
            console.log(response.statusCode)
            if (response.statusCode >= 200 && response.statusCode < 400) {
                proxy_list.succeded(proxy)
                proxy_list.failed(used_proxies)
                callback.call(that, response)
            } else if (used_proxies.length < 5) {
                used_proxies.push(proxy)
                make_request()
            } else {
                proxy_list.failed(used_proxies)
                callback.call(that, response)
            }
        })
        request.write(saved_request.body)
        request.end()
        request.on('error', function (e) {
            console.log('Proxy error: ' + e)
            used_proxies.push(proxy)
            make_request()
        })
        request.setTimeout(30000, function () {
            console.log('Proxy timeout')
            used_proxies.push(proxy)
            make_request()
        })
    }())
}

ProxyRequest.prototype.pipe_response = function (src_response, dst_response) {
    dst_response.writeHead(src_response.statusCode, src_response.headers)
    src_response.pipe(dst_response)
}
