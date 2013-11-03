var should = require('should'),
    _ = require('underscore'),
    ProxyList = require('../lib/proxy-list.js')

describe('ProxyList', function () {
    describe('ProxyList()', function () {
        var proxyList = new ProxyList()
        it('should have empty proxies object after creation', function () {
            proxyList.proxies.should.eql({})
        })
        it('should have debug property set to false', function () {
            proxyList.should.have.property('debug', false)
        })
        it('should have numeric maxFailures property', function () {
            proxyList.should.have.property('maxFailures')
            proxyList.maxFailures.should.be.a.Number
        })
    })
    describe('parseProxyList()', function () {
        var proxyList = new ProxyList()
        it('should parse proxies separated by a newline', function () {
            var proxies = ['192.168.0.1:8080', '8.8.8.8:3128', '1.2.3.4:80']
            proxyList.parseProxyList(proxies.join('\n')).should.eql(proxies)
        })
        it('should return empty array when no proxies found', function () {
            proxyList.parseProxyList('').should.eql([])
        })
        it('should skip malformed address specifications', function () {
            proxyList.parseProxyList('192.134.1:234 123.124.123.123 1.1.1.1:80 :80').should.eql(['1.1.1.1:80'])
        })
    })
    describe('loadFromString()', function () {
        var proxyList = new ProxyList()
        it('should set proxies property with addresses as keys and zeros as values', function () {
            var proxies = '1.1.1.1:10 2.2.2.2:20 3.3.3.3:30'
            proxyList.loadFromString(proxies)
            proxyList.proxies.should.eql({'1.1.1.1:10': 0, '2.2.2.2:20': 0, '3.3.3.3:30': 0})
        })
        it('should replace current proxy list', function () {
            proxyList.loadFromString('1.2.3.4:5 2.3.4.5:6')
            proxyList.proxies.should.eql({'1.2.3.4:5': 0,  '2.3.4.5:6': 0})
        })
    })
    describe('getProxy()', function () {
        var proxyList = new ProxyList()
        proxyList.loadFromString('1.1.1.1:10 2.2.2.2:20 3.3.3.3:30')
        it('should return a proxy as a string', function () {
            proxyList.getProxy().should.be.a.String
        })
        it('should return a proxy from loaded list', function () {
            var proxy = proxyList.getProxy()
            ;['1.1.1.1:10', '2.2.2.2:20', '3.3.3.3:30'].should.include(proxy)
        })
        it('should respect exclude argument', function () {
            var exclude = ['1.1.1.1:10', '2.2.2.2:20']
            var proxy = proxyList.getProxy(exclude)
            exclude.should.not.include(proxy)
        })
        it('should throw when all existing proxies are being excluded', function () {
            (function () {
                proxyList.getProxy(['1.1.1.1:10', '2.2.2.2:20', '3.3.3.3:30'])
            }).should.throw('Out of proxies')
        })
    })
    describe('proxyFailed()', function () {
        var proxyList = new ProxyList()
        it('should increment corresponding internal proxies object value', function () {
            proxyList.loadFromString('1.1.1.1:10 2.2.2.2:20 3.3.3.3:30')
            var proxy = '1.1.1.1:10'
            proxyList.proxies.should.have.property(proxy, 0)
            proxyList.proxyFailed(proxy)
            proxyList.proxies.should.have.property(proxy, 1)
        })
        it('should work on array of proxies', function () {
            proxyList.loadFromString('1.1.1.1:10 2.2.2.2:20 3.3.3.3:30')
            var proxies = ['1.1.1.1:10', '2.2.2.2:20']
            proxies.forEach(function (proxy) {
                proxyList.proxies.should.have.property(proxy, 0)
            })
            proxyList.proxyFailed(proxies)
            proxies.forEach(function (proxy) {
                proxyList.proxies.should.have.property(proxy, 1)
            })
        })
        it('should remove proxy from proxies object when maxFailures reached', function () {
            proxyList.loadFromString('1.1.1.1:10 2.2.2.2:20 3.3.3.3:30')
            var proxy = '2.2.2.2:20'
            for (var i = 0; i < proxyList.maxFailures; i += 1)
                proxyList.proxyFailed([proxy])
            proxyList.proxies.should.not.have.property(proxy)
        })
    })
    describe('proxySucceeded()', function () {
        var proxyList = new ProxyList()
        it('should set corresponding internal proxies object value to zero', function () {
            proxyList.loadFromString('1.1.1.1:10 2.2.2.2:20 3.3.3.3:30')
            var proxy = '2.2.2.2:20'
            proxyList.proxyFailed(proxy)
            proxyList.proxies.should.have.property(proxy, 1)
            proxyList.proxySucceeded(proxy)
            proxyList.proxies.should.have.property(proxy, 0)
        })
        it('should work on array of proxies', function () {
            proxyList.loadFromString('1.1.1.1:10 2.2.2.2:20 3.3.3.3:30')
            var proxies = ['1.1.1.1:10', '2.2.2.2:20']
            proxyList.proxyFailed(proxies)
            proxies.forEach(function (proxy) {
                proxyList.proxies.should.have.property(proxy, 1)
            })
            proxyList.proxySucceeded(proxies)
            proxies.forEach(function (proxy) {
                proxyList.proxies.should.have.property(proxy, 0)
            })
        })
    })
})
