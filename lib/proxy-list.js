var fs = require('fs'),
    _ = require('underscore')


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


function ProxyList(filename) {
    if (!(this instanceof ProxyList)) return new ProxyList(filename)
    this.proxies = this.load(filename)
    this.proxyLookup = makeLookup(this.proxies)
    this.maxFailures = 10
    // TODO: fs.watch for filename and load new proxies on change
}

ProxyList.prototype.load = function (filename) {
    return fs.readFileSync(filename, {encoding: 'utf8'})
           .split('\n').filter(function (line) {return line}).map(Proxy)
}

ProxyList.prototype.fetch = function (exclude) {
    var exclude = makeLookup(exclude || [])
    return _.find(this.proxies, function (item) {
        return !(item in exclude)
    })
}

ProxyList.prototype.succeded = function (proxy) {
    this.proxyLookup[proxy].failures = 0
}

ProxyList.prototype.failed = function (proxy) {
    proxy = this.proxyLookup[proxy]
    proxy.failures = 'failures' in proxy ? proxy.failures + 1 : 1
    if (proxy.failures > this.maxFailures) {
        delete this.proxyLookup[proxy]
        this.proxies = _.values(this.proxyLookup)
    }
}


function makeLookup(list) {
    var table = {}
    _.each(list, function (item) {table[item] = item})
    return table
}


module.exports = ProxyList
