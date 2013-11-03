var fs = require('fs'),
    _ = require('underscore')


function ProxyList(options) {
    _.extend(this, {
        debug: false,
        maxFailures: 3,
    }, options || {})
    this.proxies = {}
}

ProxyList.prototype.parseProxyList = function (proxyListString) {
    var proxySpec = /\b\d+(?:\.\d+){3}:\d+\b/g
    return proxyListString.match(proxySpec) || []
}

ProxyList.prototype.loadFromString = function (proxyListString) {
    var proxies = this.parseProxyList(proxyListString)
    this.proxies = _.object(proxies.map(function (proxy) { return [proxy, 0] }))
}

ProxyList.prototype.loadFromFile = function (filename) {
    var fileContent = fs.readFileSync(filename, {encoding: 'utf8'})
    return this.loadFromString(fileContent)
}

ProxyList.prototype.getProxy = function (exclude) {
    var excludeMap = _.object((exclude || []).map(function (proxy) { return [proxy, true] }))
    var proxy = _.find(_.keys(this.proxies), function (proxy) { return !excludeMap[proxy] })
    if (!proxy) throw Error('Out of proxies')
    return proxy
}

ProxyList.prototype.proxyFailed = function (proxies) {
    proxies = Array.isArray(proxies) ? proxies : [proxies]
    proxies.forEach(function (proxy) {
        if (!(proxy in this.proxies)) return
        this.proxies[proxy] += 1
        if (this.proxies[proxy] >= this.maxFailures)
            delete this.proxies[proxy]
    }, this)
}

ProxyList.prototype.proxySucceeded = function (proxies) {
    proxies = Array.isArray(proxies) ? proxies : [proxies]
    proxies.forEach(function (proxy) {
        if (proxy in this.proxies)
            this.proxies[proxy] = 0
    }, this)
}


module.exports = ProxyList
