#ninja-proxy

A proxy server to aggregate a list of unreliable proxies (typically taken from one of those "Free Proxy List" websites) into reliable one.

##Usability notice

I don't consider this software to be that concrete-stable production ready, but it is good enough to pipe hundreds of requests through itself.
It helps me to get what I want in it's current state, and I believe it could be helpful for somebody else.

##Installation

- Download the software and install dependency packages.

```bash
git clone https://github.com/furagu/ninja-proxy.git
cd ninja-proxy
npm install
```

- Get a list of proxy servers and put it into ninja-proxy/proxies.txt file.
Free proxies could be found at [hidemyass.com](http://hidemyass.com/proxy-list/) or [spys.ru](http://spys.ru/proxylist/) or anywhere else.
Make a list of proxies, each on a new line in the HOST:PORT form and save it to ninja-proxy/proxies.txt.


- That's it! Run the server with the following command

```bash
cd ninja-proxy
node index.js
```

Server listens on 127.0.0.1:8080. Set this address as a proxy in the software or program you use.
Some debugging info is printed into console while working.

##TODO

- Some proxies respond with only a part of requested content. May be it is possible to track such cases with content-length header analysis.
- Ninja-proxy could validate proxies itself using httpbin.org.
