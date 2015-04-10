netshd is a wrapper around `netsh` windows tool for managing network.

Initial features :
- scan available wifi networks


Example : 
```
var netshd = require("netshd");

var nd = new netshd();
var prefered = "FreeWifi";


nd.addEvent('wifiFound', function(infos) {
  console.log("new wifi found : " + infos.ssid);
});

nd.addEvent('wifiLost', function(infos) {
  console.log("wifi lost : " + infos.ssid);
});


setInterval(function(){
  console.log("Prefered SSID %s is %s", prefered, nd.isWLANAvailable(prefered));
}, 1000);

nd.start();

setTimeout(nd.stop, 10 * 1000);
```