
var process = require("child_process");
var Class   = require("uclass");
var Events  = require("uclass/events");

var difference = require('mout/array/difference');

var netshd = module.exports = new Class ({
  Implements : [Events],
  Binds : [ 'start', 'stop', '_scanWifi', 'isWLANAvailable'],
  
  _knownWifis : null,
  _daemonFreqPolling : null,
  _daemonWorker : null,
  

  initialize : function() {
    console.log("Initialize module netsh daemon");
    this._knownWifis = {};
    this._daemonFreqPolling = 2; // seconds
  },


  start : function() {
    console.log("Starting netsh daemon");
    var self = this;
    this._daemonWorker = setInterval(function() {
      self._scanWifi();
    }, this._daemonFreqPolling * 1000);
    self._scanWifi();
  },

  stop : function() {
    console.log("Stopping netsh daemon");
    if (this._daemonWorker) {
      clearInterval(this._daemonWorker);
      this._daemonWorker = null;      
    }
  },


  isWLANAvailable : function (ssid) {
    return !! this._knownWifis[ssid];
  },

  _scanWifi : function() {
    var self = this,
        cmd  = "netsh wlan show networks";
    var proc = process.exec(cmd , function( error, stdout){
      if (error) {
        console.error("Error spawning netsh : " + proc.error);
        self._knownWifis = {};
        return;
      }

      // Fetching visible ssid
      var ssids = [], output = stdout.toString();
      output.split("\n").forEach(function(line) {
        var parts = line.trim().split(":");
        if (parts[0].indexOf("SSID") === 0 && parts[1].trim().length > 0)
          ssids.push(parts[1].trim());
      });
      
      // New wlan found
      ssids.forEach(function(ssid) {
        if (!self._knownWifis[ssid]) {
          var infos = {ssid:ssid};
          self._knownWifis[ssid] = infos ;
          self.fireEvent(netshd.EVENT_WIFI_FOUND, infos);
        }
      });
      
      // wlan to remove
      var toRemove = difference(Object.keys(self._knownWifis), ssids);
      toRemove.forEach(function(ssid) {
        var gone = self._knownWifis[ssid];
        delete self._knownWifis[ssid];
        self.fireEvent(netshd.EVENT_WIFI_LOST, gone);
      });
    });
  }
});

netshd.EVENT_SERVICE_UP = 'serviceUp';
netshd.EVENT_SERVICE_DOWN = 'serviceDown';
netshd.EVENT_WIFI_FOUND = 'wifiFound';
netshd.EVENT_WIFI_LOST = 'wifiLost';