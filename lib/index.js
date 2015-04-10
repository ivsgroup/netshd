require("nyks");

var _       = require("underscore"),
    process = require("child_process");

var netshd = module.exports = new Class ({
  Implements : [Events],
  Binds : [ 'start', 'stop', '_scanWifi', 'isWlanAvailable'],
  
  _knownWifis : null,
  _daemonFreqPolling : null,
  _daemonWorker : null,
  
  // ------------------------------------------------
  initialize : function() {
    console.log("Initialize module netsh daemon");
    this._knownWifis = [];
    this._daemonFreqPolling = 2; // seconds
  },
  // ------------------------------------------------
  start : function() {
    console.log("Starting netsh daemon");
    var self = this;
    this._daemonWorker = setInterval(function() {
      self._scanWifi();
    }, this._daemonFreqPolling * 1000);
    self._scanWifi();
  },
  // ------------------------------------------------
  stop : function() {
    console.log("Stopping netsh daemon");
    if (this._daemonWorker) {
      clearInterval(this._daemonWorker);
      this._daemonWorker = null;      
    }
  },
  // ------------------------------------------------
  isWlanAvailable : function (ssid) {
    return (this._knownWifis.indexOf(ssid) >= 0);
  },
  // ------------------------------------------------
  // ------------------------------------------------
  _scanWifi : function() {
    var self = this;
    var proc = process.spawn("netsh", ["wlan", "show", "networks"]);
    if (proc.error) {
      console.error("Error spawning netsh : " + proc.error);
      self._knownWifis = [];
      return;
    }
    
    proc.stderr.on("data", function(data) {
      console.error(data);
    });
    
    var output = "";
    
    proc.stdout.on("data", function(data) {
      output += data;
    });
    
    proc.on("close", function(code) {
      // Fetching visible ssid
      var ssids = [];
      output.split("\n").forEach(function(line) {
        var parts = line.trim().split(":");
        if (parts[0].indexOf("SSID") === 0 && parts[1].trim().length > 0)
          ssids.push(parts[1].trim());
      });
      
      // New wlan found
      ssids.forEach(function(ssid) {
        if (self._knownWifis.indexOf(ssid) === -1) {
          self._knownWifis.push(ssid);
          self.fireEvent(netshd.EVENT_WIFI_FOUND, ssid);
        }
      });
      
      // wlan to remove
      var toRemove = _.difference(self._knownWifis, ssids);
      toRemove.forEach(function(ssid) {
        var pos = self._knownWifis.indexOf(ssid);
        self._knownWifis.splice(pos, 1);
        self.fireEvent(netshd.EVENT_WIFI_LOST, ssid);
      });
    });
  }
});

netshd.EVENT_SERVICE_UP = 'serviceUp';
netshd.EVENT_SERVICE_DOWN = 'serviceDown';
netshd.EVENT_WIFI_FOUND = 'wifiFound';
netshd.EVENT_WIFI_LOST = 'wifiLost';