netshd is a wrapper around `netsh` windows tool for managing network.

Initial features :
- scan available wifi networks


Example : 
-------------------------------------------------------
var netshd = require("netshd");

var nd = new netshd();

nd.addEvent('wifiFound', function(ssid) {
  console.log("new wifi found : " + ssid);
});

nd.addEvent('wifiLost', function(ssid) {
  console.log("wifi lost : " + ssid);
});

nd.start();

setTimeout(nd.stop, 10 * 1000);
-------------------------------------------------------