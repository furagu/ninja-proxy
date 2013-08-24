var fs = require('fs'),
    _ = require('underscore')


function ProxyList(filename) {
    if (!(this instanceof ProxyList)) return new ProxyList(filename)
    var proxies = this.load(filename)
    this.proxies = _.object(proxies, proxies)
    this.maxFailures = 10
    // TODO: fs.watch for filename and load new proxies on change
}

ProxyList.prototype.load = function (filename) {
    var lines = fs.readFileSync(filename, {encoding: 'utf8'}).split('\n')
    return _.compact(lines).map(Proxy)
}

ProxyList.prototype.fetch = function (exclude) {
    var excludeMap = _.object(exclude, exclude)
    return _.find(_.values(this.proxies), function (x) {return !(x in excludeMap)})
}

ProxyList.prototype.succeded = function (proxies) {
    proxies = Array.isArray(proxies) ? proxies : [proxies]
    proxies.forEach(function (proxy) {
        if (proxy in this.proxies)
            this.proxies[proxy].failures = 0
    }, this)
}

ProxyList.prototype.failed = function (proxies) {
    proxies = Array.isArray(proxies) ? proxies : [proxies]
    proxies.forEach(function (proxy) {
        proxy = this.proxies[proxy]
        if (proxy) {
            proxy.failures = 'failures' in proxy ? proxy.failures + 1 : 1
            if (proxy.failures > this.maxFailures) {
                delete this.proxies[proxy]
                this.proxies = _.values(this.proxyLookup)
            }
        }
    }, this)
}


function Proxy(addr) {
    if (!(this instanceof Proxy)) return new Proxy(addr) // セーフ！
    var parts = addr.split(':')
    this.host = parts[0]
    this.port = parseInt(parts[1], 10)
    if (!this.host || !this.port) throw Error('Bad proxy address: ' + addr)
}

Proxy.prototype.toString = function () {
    return this.host + ':' + this.port
}


module.exports = ProxyList
