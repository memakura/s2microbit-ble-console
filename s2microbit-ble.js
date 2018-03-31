"use strict";
// https://github.com/sandeepmistry/node-bbc-microbit/blob/master/API.md
// Some part of the code is from 
// https://github.com/jaafreitas/scratch-microbit-extension/

let BBCMicrobit = require('bbc-microbit');
let device = null;
let microbitConnected = false;

const BUTTON_VALUE_MAPPER = ['Not Pressed', 'Pressed', 'Long Press'];

let debug = false;

// functionality
let useButtons = true;
let useTemperature = true;
let useAccelerometer = true;
let useMagnetometer = false;
let usePins = true;

// states and values
let buttonState = null;
let matrixState = null;
let pinValue = null;
let pinMode = null;
let temperature = null;
let magnetometerBearing = null;
let magnetometer = null;
let accelerometer = null;
let prev_acc_z = null;
let ledBuffer = null;
let deviceName = null;


const PIN_NOTSET = 0xFF;
const PINMODE_OUTPUT_DIGITAL = 0x00;
const PINMODE_INPUT = 0x01;
const PINMODE_ANALOG = 0x02;
const PINMODE_ANALOG_INPUT = 0x03;

// LED matrix patterns (new Buffer has been deprecated: https://nodejs.org/api/buffer.html#buffer_buffer)
const LED_PATTERNS = [
  {name: 'HAPPY', value: Buffer.from([0b00000, 0b01010, 0b00000, 0b10001, 0b01110])},
  {name: 'SAD',   value: Buffer.from([0b00000, 0b01010, 0b00000, 0b01110, 0b10001])},
  {name: 'ANGRY', value: Buffer.from([0b10001, 0b01010, 0b00000, 0b11111, 0b10101])},
  {name: 'SMILE', value: Buffer.from([0b00000, 0b00000, 0b00000, 0b10001, 0b01110])},
  {name: 'HEART', value: Buffer.from([0b01010, 0b11111, 0b11111, 0b01110, 0b00100])},
  {name: 'CONFUSED', value: Buffer.from([0b00000, 0b01010, 0b00000, 0b01010, 0b10101])},
  {name: 'ASLEEP', value: Buffer.from([0b00000, 0b11011, 0b00000, 0b01110, 0b00000])},
  {name: 'SURPRISED', value: Buffer.from([0b01010, 0b00000, 0b00100, 0b01010, 0b00100])},
  {name: 'SILLY', value: Buffer.from([0b10001, 0b00000, 0b11111, 0b00101, 0b00111])},
  {name: 'FABULOUS', value: Buffer.from([0b11111, 0b11011, 0b00000, 0b01010, 0b01110])},
  {name: 'MEH', value: Buffer.from([0b01010, 0b00000, 0b00010, 0b00100, 0b01000])},
  {name: 'YES', value: Buffer.from([0b00000, 0b00001, 0b00010, 0b10100, 0b01000])},
  {name: 'NO', value: Buffer.from([0b10001, 0b01010, 0b00100, 0b01010, 0b10001])},
  {name: 'TRIANGLE', value: Buffer.from([0b00000, 0b00100, 0b01010, 0b11111, 0b00000])},
  {name: 'DIAMOND', value: Buffer.from([0b00100, 0b01010, 0b10001, 0b01010, 0b00100])},
  {name: 'DIAMOND_SMALL', value: Buffer.from([0b00000, 0b00100, 0b01010, 0b00100, 0b00000])},
  {name: 'SQUARE', value: Buffer.from([0b11111, 0b10001, 0b10001, 0b10001, 0b11111])},
  {name: 'SQUARE_SMALL', value: Buffer.from([0b00000, 0b01110, 0b01010, 0b01110, 0b00000])},
  {name: 'TARGET', value: Buffer.from([0b00100, 0b01110, 0b11011, 0b01110, 0b00100])},
  {name: 'STICKFIGURE', value: Buffer.from([0b00100, 0b11111, 0b00100, 0b01010, 0b10001])},
  {name: 'RABBIT', value: Buffer.from([0b10100, 0b10100, 0b11110, 0b11010, 0b11110])},
  {name: 'COW', value: Buffer.from([0b10001, 0b10001, 0b11111, 0b01110, 0b00100])},
  {name: 'ROLLERSKATE', value: Buffer.from([0b00011, 0b00011, 0b11111, 0b11111, 0b01010])},
  {name: 'HOUSE', value: Buffer.from([0b00100, 0b01110, 0b11111, 0b01110, 0b01010])},
  {name: 'SNAKE', value: Buffer.from([0b11000, 0b11011, 0b01010, 0b01110, 0b00000])},
  {name: 'ARROW_N', value: Buffer.from([0b00100, 0b01110, 0b10101, 0b00100, 0b00100])},
  {name: 'ARROW_NE', value: Buffer.from([0b00111, 0b00011, 0b00101, 0b01000, 0b10000])},
  {name: 'ARROW_E', value: Buffer.from([0b00100, 0b00010, 0b11111, 0b00010, 0b00100])},
  {name: 'ARROW_SE', value: Buffer.from([0b10000, 0b01000, 0b00101, 0b00011, 0b00111])},
  {name: 'ARROW_S', value: Buffer.from([0b00100, 0b00100, 0b10101, 0b01110, 0b00100])},
  {name: 'ARROW_SW', value: Buffer.from([0b00001, 0b00010, 0b10100, 0b11000, 0b11100])},
  {name: 'ARROW_W', value: Buffer.from([0b00100, 0b01000, 0b11111, 0b01000, 0b00100])},
  {name: 'ARROW_NW', value: Buffer.from([0b11100, 0b11000, 0b10100, 0b00010, 0b00001])},
  {name: 'HEART_SMALL', value: Buffer.from([0b000000, 0b01010, 0b01110, 0b00100, 0b00000])},
  {name: 'TRIANGLE_LEFT', value: Buffer.from([0b10000, 0b11000, 0b10100, 0b10010, 0b11111])},
  {name: 'CHESSBOARD', value: Buffer.from([0b01010, 0b10101, 0b01010, 0b10101, 0b01010])},
  {name: 'PITCHFORK', value: Buffer.from([0b10101, 0b10101, 0b11111, 0b00100, 0b00100])},
  {name: 'XMAS', value: Buffer.from([0b00100, 0b01110, 0b00100, 0b01110, 0b11111])},
  {name: 'TSHIRT', value: Buffer.from([0b11011, 0b11111, 0b01110, 0b01110, 0b01110])},
  {name: 'SWORD', value: Buffer.from([0b00100, 0b00100, 0b00100, 0b01110, 0b00100])},
  {name: 'UMBRELLA', value: Buffer.from([0b01110, 0b11111, 0b00100, 0b10100, 0b01100])},
  {name: 'DUCK', value: Buffer.from([0b01100, 0b11100, 0b01111, 0b01110, 0b00000])},
  {name: 'TORTOSE', value: Buffer.from([0b00000, 0b01110, 0b11111, 0b01010, 0b00000])},
  {name: 'BUTTERFLY', value: Buffer.from([0b11011, 0b11111, 0b00100, 0b11111, 0b11011])},
  {name: 'GIRAFFE', value: Buffer.from([0b11000, 0b01000, 0b01000, 0b01110, 0b01010])},
  {name: 'SKULL', value: Buffer.from([0b01110, 0b10101, 0b11111, 0b01110, 0b01110])},
  {name: 'MUSIC_CHOTCHET', value: Buffer.from([0b00100, 0b00100, 0b00100, 0b11100, 0b11100])},
  {name: 'MUSIC_QUAVER', value: Buffer.from([0b00100, 0b00110, 0b00101, 0b11100, 0b11100])},
  {name: 'MUSIC_QUAVERS', value: Buffer.from([0b01111, 0b01001, 0b01001, 0b11011, 0b11011])}
];
let LED_PATTERN_MAP = { }; // map : pattern name -> value
function createLedPatternMap() {
  for (var i=0; i < LED_PATTERNS.length; i++){
    LED_PATTERN_MAP[LED_PATTERNS[i].name] = LED_PATTERNS[i].value; // value=reference
  }
}
createLedPatternMap();

// Initialization
function initValues () {
  console.log("Initialize values...");
  buttonState = {A: 0, B: 0};
  matrixState = [0, 0, 0, 0, 0];
  // The array has space for P0 to P20 (including P17 and P18).
  pinValue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // 00(0):D-Out, 01(1):D-In, 10(2):A-Out, 11(3):A-In
  pinMode = [PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, 
      PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, 
      PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, 
      PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET, PIN_NOTSET];

  // Initialize LED matrix
  ledBuffer = Buffer.alloc(5);
  LED_PATTERN_MAP['YES'].copy(ledBuffer); // copy the value (do not pass by reference)

  // Initialize sensor data
  temperature = 0;
  magnetometerBearing = 0;
  magnetometer = { 'x': 0, 'y': 0, 'z': 0 };
  accelerometer = { 'x': 0, 'y': 0, 'z': 0 };
  prev_acc_z = 0;
}

initValues();

// Discover microbit
console.log("=== BBC micro:bit Scratch 2.0 offline extension ===");

var id = 'dd628ee75dfe';
//var id = 'd5a250cd6035';
function microbitScanner() {
  console.log('microbit: scanning...');
  //BBCMicrobit.discoverAll(onDiscover); // find all microbits

  BBCMicrobit.discoverById(id, microbitFound);
  //BBCMicrobit.discover(microbitFound);
}

// Callback of discoverAll
function onDiscover(microbit) {
  console.log("  found microbit : " + microbit);
}

microbitScanner();

// Show pin settings
function showPinSetting(microbit) {
  microbit.readPinAdConfiguration(function(error, value) {
    console.log("pinsetting AD: " + value);
  });
  microbit.readPinIoConfiguration(function(error, value) {
    console.log("pinsetting IO: " + value);
  });  
}


// Initialize 0-2 pin setting to Analog-Input
function initializePinSetting(microbit) {
  /*
  microbit.writePinAdConfiguration(0x07, function(error) {
    console.log("writePinAdConfiguration (error): ", error);
    microbit.writePinIoConfiguration(0x07, function(error) {
      console.log("writePinIoConfiguration (error): ", error);
//      microbit.subscribePinData(function(error) {
//        console.log("subscribePinData (error): ", error);
        microbit.readPin(function(error, value) { // triger pinDataChange...
          showPinSetting(microbit);
          for (var pin=0; pin <= 2; pin++) {
            pinMode[pin] = PINMODE_ANALOG_INPUT;
          }
        });
      });
    });
//  });
*/
  for (var pin=0; pin <= 2; pin++) {
    setupPinMode({pin: pin, ADmode: 'analog', IOmode: 'input'});    
  }
}


// Callback when discovered
function microbitFound(microbit) {
  console.log('microbit: discovered %s', microbit); // microbit.id, microbit.address

  // Events from microbit
  microbit.on('disconnect', function() {
    microbitConnected = false;
    device = null;
    console.log('microbit: disconnected ' + microbitConnected);
    microbitScanner();
  });

  microbit.on('buttonAChange', function(value) {
    if (debug) { console.log('microbit: button A', BUTTON_VALUE_MAPPER[value]); }
    buttonState['A']= value;
  });

  microbit.on('buttonBChange', function(value) {
    if (debug) { console.log('microbit: button B', BUTTON_VALUE_MAPPER[value]); }
    buttonState['B']= value;
  });

  microbit.on('pinDataChange', function(pin, value) {
    if (debug) { console.log('microbit: pinDataChange pin %d, value %d', pin, value); }
    pinValue[pin] = value;
  });

  microbit.on('temperatureChange', function(value) {
    if (debug) { console.log('microbit: temperature %d', value); }
    temperature = value;
  });

  microbit.on('magnetometerBearingChange', function(value) {
    console.log('microbit: magnetometer bearing %d', value);
    if (debug) { console.log('microbit: magnetometer bearing %d', value); }
    magnetometerBearing = value;
  });

  microbit.on('magnetometerChange', function(x, y, z) {
    // console.log('microbit: orig magnetometer %d, %d, %d', x, y, z);
    x = x.toFixed(2);
    y = y.toFixed(2);
    z = z.toFixed(2);
    //if (debug) { console.log('microbit: magnetometer %d, %d, %d', x, y, z); }
    magnetometer = { 'x': x, 'y': y, 'z': z };
  });

  microbit.on('accelerometerChange', function(x, y, z) {
    // console.log('microbit: orig accelerometer %d, %d, %d', x, y, z);    
    x = x.toFixed(2);
    y = y.toFixed(2);
    z = z.toFixed(2);
    //if (debug) { console.log('microbit: accelerometer %d, %d, %d', x, y, z); }
    accelerometer = { 'x': x, 'y': y, 'z': z };
  });

  // When connected
  console.log('microbit: connecting...');
  microbit.connectAndSetUp(function() {
    microbitConnected = true;
    device = microbit;
    console.log('microbit: connected ' + microbitConnected);

    if (useButtons) {
      microbit.subscribeButtons(function(error) {
        console.log('microbit: subscribed to buttons');
      });
    }
    if (useTemperature) {
      microbit.writeTemperaturePeriod(1000, function() {
        microbit.subscribeTemperature(function(error) {
          console.log('microbit: subscribed to temperature');
        });
      });
    }
    if (useMagnetometer) {
      microbit.writeMagnetometerPeriod(160, function() {
        // Use either of Bearing or XYZ 
        /*
        microbit.subscribeMagnetometerBearing(function(error) {
          console.log('microbit: subscribed to magnetometer bearing');
        });
        */
        microbit.subscribeMagnetometer(function(error) {
          console.log('microbit: subscribed to magnetometer');
        });
      });
    }
    if (useAccelerometer) {
      microbit.writeAccelerometerPeriod(160, function() {
        microbit.subscribeAccelerometer(function(error) {
          console.log('microbit: subscribed to accelerometer');
        });
      });
    }
    if (usePins) {
      microbit.subscribePinData(function(error) {
        console.log("subscribePinData (error): ", error);
        initializePinSetting(microbit); // Initialize pin 0-2
      });
    }
    // Read device name
    microbit.readDeviceName(function(error, devicename) {
      console.log('microbit deviceName: ' + devicename);
      deviceName = devicename;
    });

    // Initial pattern
    microbit.writeLedMatrixState(ledBuffer, function(error){
        console.log("microbit: [write ledmatrix] buf= " + val.toString(2));
    });
    if (exserver === null) {
      startHTTPServer();
    }
  });
}

// ================= HTTP server =======================
var express = require('express');
var exapp = express();
let exserver = null;

function startHTTPServer(){
  exserver = exapp.listen(50209, function(){
    console.log("Server started... listening port " + exserver.address().port);
  });
}

//--- Responses to HTTP requrests from Scratch 2.0
exapp.get('/scroll/:text', function(req, res) {
  if (device) {
    // text is a string that must be 20 characters or less
    var txt = req.params.text.substring(0, 20);
    device.writeLedText(txt, function(error) {
      console.log('microbit: display %s', txt);
    });
  }
  res.send("OK");
});

// Reset from scratch
exapp.get('/reset_all', function(req, res){
  console.log('reset_all is called');
  initValues();
  initializePinSetting(device);  // Initialize pin 0-2
  res.send("OK");
});

// LED matrix (image pattern)
function writeLedBuffer(error) {
  device.writeLedMatrixState(ledBuffer, function(error) {
      console.log("writeLedBuffer: buf= ", ledBuffer);
  });
}
// LED display preset image
exapp.get('/display_image/:name', function(req, res) {
  if (device) {
    var name = req.params.name;
    if (name.charAt(2) == '_') { // non-English
      LED_PATTERNS[name.substr(0,2)-1].value.copy(ledBuffer);
    } else { // English
      LED_PATTERN_MAP[name].copy(ledBuffer);
    }
    console.log('microbit: [display_image] name= ' + name);
    writeLedBuffer();
  }
  res.send("OK");
});

// LED dot
exapp.get('/write_pixel/:x/:y/:value', function(req, res){
  if (device){
      var val = req.params.value;
      if (val >= 1) {
        val = 1;
      }else{
        val = 0;
      }
      var x = req.params.x;
      if (x < 0){
        x = 0;
      }
      if (x > 4){
        x = 4;
      }
      var y = req.params.y;
      if (y < 0){
        y = 0;
      }
      if (y > 4){
        y = 4;
      }
      ledBuffer[y] &= ~(0x01<<x); // clear the pixel (set 0)
      ledBuffer[y] |=  val<<x; // set the pixel to 'val'
      console.log('microbit: [write_pixel] val=%d to (%d, %d)', val, x, y);
      writeLedBuffer();
  }
  res.send("OK");  
});

// LED display custom pattern
exapp.get('/display_pattern/:binstr', function(req, res) {
  if (device) {    
    console.log('microbit: [display_pattern] str= %s', req.params.binstr);
    var binstr = req.params.binstr;
    // check
    var linearray = binstr.split(' ');
    // check
    for (var s in linearray) {
      console.log('s= %s', s);
    }
    if (linearray.length != 5) {
      console.log('error: illegal array length= %d', linearray.length);
      return;
    }
    for (var y=0; y < 5; y++) {
      ledBuffer.writeUInt8(parseInt(linearray[y], 2), y);
      console.log('buf[%d] = %d', y, ledBuffer[y]);
    }
    writeLedBuffer();
  }
  res.send("OK");
});

// clear LED
exapp.get('/display_clear', function(req, res){
  if (device){
    ledBuffer.fill(0);
    console.log('microbit: [display_clear]');
    writeLedBuffer();
  }
  res.send("OK");
});

// PIN I/O
// Should we use wait block?
exapp.get('/setup_pin/:pin/:admode/:iomode', function(req, res) {
  console.log('setup_pin is called');
  if (device) {
    var pin = req.params.pin;
    if(pin < 0 || pin > 20 ){
      console.log('[setup_pin] error: pin number (%d) is out of range', pin);
      return;
    }
    //    pinMode[pin] = PIN_NOTSET; // once reset mode

    var admode = req.params.admode;
    if (admode.charAt(0) == 'D') {
      admode = 'digital';
    } else if(admode.charAt(0) == 'A') {
      admode = 'analog';
    } else {
      console.log('[setup_pin] error: no such ADmode: %s', admode);
      return;
    }
    var iomode = req.params.iomode;
    if (iomode.charAt(0) == 'I') {
      iomode = 'input';
    } else if (iomode.charAt(0) == 'O') {
      iomode = 'output';
    } else {
      console.log('[setup_pin] error: no such IOmode: %s', iomode);
      return;
    }
    setupPinMode({pin: pin, ADmode: admode, IOmode: iomode});
  }
  res.send("OK");
});

exapp.get('/digital_write/:pin/:value', function(req, res) {
  if (device) {
    var pin = req.params.pin;
    if(pin < 0 || pin > 20 ){
      console.log('error: pin number (%d) is out of range', pin);
      return;
    }
    if ( (pinMode[pin] & PINMODE_INPUT) == PINMODE_INPUT || (pinMode[pin] & PINMODE_ANALOG) == PINMODE_ANALOG ) {
      console.log("[digital_write] setup pin mode : current pinMode[%d]= %d", pin, pinMode[pin]);
      setupPinMode({pin: pin, ADmode: 'digital', IOmode: 'output'});
    }else{
      var val = req.params.value;
      if(val >= 1) {
        val = 1;
      }else{
        val = 0;
      }
      device.writePin(pin, val, function(error) {
        console.log('microbit: [digital_write] pin %d, val %d', pin, val);
      });
    }
  }
  res.send("OK");
});

exapp.get('/analog_write/:pin/:value', function(req, res) {
  if (device) {
    var pin = req.params.pin;
    if(pin < 0 || pin > 20 ){
      console.log('error: pin number (%d) is out of range', pin);
      return;
    }
    if ( (pinMode[pin] & PINMODE_INPUT) == PINMODE_INPUT || (pinMode[pin] & PINMODE_ANALOG) != PINMODE_ANALOG ) {
      console.log('[analog_write] setup pin mode : current pinMode[%d]= %d', pin, pinMode[pin]);
      setupPinMode({pin: pin, ADmode: 'analog', IOmode:' output'});
    }else{
      var val = req.params.value;
      if(val > 255) {
        val = 255;
      }
      if(val < 0) {
        val = 0;
      }
      device.writePin(pin, val, function(error) {
        console.log('microbit: [analog_write] pin %d, val %d', pin, val);
      });
    }
  }
  res.send("OK");
});
// -- Need test --

// boolean reports
exapp.get('/poll', function(req, res) {
  var reply = "";
  reply += "button_a_pressed " + (buttonState['A']!=0) + "\n";
  reply += "button_b_pressed " + (buttonState['B']!=0) + "\n";
  for (var pin=0; pin <= 20; pin++){
    if ((pinMode[pin] != PIN_NOTSET) && (pinMode[pin] & PINMODE_INPUT)){
      if (pinMode[pin] & PINMODE_ANALOG){
        reply += "analog_read/" + pin + " " + pinValue[pin] + "\n";
      }else{
        reply += "digital_read/" + pin + " " + pinValue[pin] + "\n";
      }
    }
  }
  if (accelerometer['x'] > 0) {
    reply += "tilted_right true\ntilted_left false\n";
  } else {
    reply += "tilted_right false\ntilted_left true\n";
  }
  if (accelerometer['y'] > 0) {
    reply += "tilted_up true\ntilted_down false\n";
  } else {
    reply += "tilted_up false\ntilted_down true\n";
  }
  if ( Math.abs(accelerometer['z'] - prev_acc_z) > 0.7 ) {
    reply += "shaken true\n";
  } else {
    reply += "shaken false\n";
  }
  prev_acc_z = accelerometer['z'];

  // sensor values
  reply += "temperature " + temperature + "\n";
  reply += "magBearing " + magnetometerBearing + "\n";
  reply += "mag_x " + magnetometer['x'] + "\n";
  reply += "mag_y " + magnetometer['y'] + "\n";
  reply += "mag_z " + magnetometer['z'] + "\n";
  reply += "acc_x " + accelerometer['x'] + "\n";
  reply += "acc_y " + accelerometer['y'] + "\n";
  reply += "acc_z " + accelerometer['z'] + "\n";

  res.send(reply);
  if (debug) { console.log(reply); }
});
// =============================================================


// Setting up pin mode (analog/digital and input/output)
function setupPinMode(data) {
  if (device) { //  && (pinMode[data.pin]==PIN_NOTSET)// setup only once
    console.log("setupPinMode: pin %d is originally configured as: %d", data.pin, pinMode[data.pin]);
    function log(data) {
      console.log('microbit: setup pin %d as %s %s', data.pin, data.ADmode, data.IOmode);
    }
    // SubscribeData
    function subscribe(device, data) {
//      device.subscribePinData(function(error) {
        log(data);
        // It will trigger a pinDataChange.
        device.readPin(data.pin, function(error, value) {
          showPinSetting(device);
        });
//      });
    }
    // UnsubscribeData
    function unsubscribe(device) {
//      device.unsubscribePinData(function(error) {
        log(data);
        showPinSetting(device);
//      });
    }

    pinMode[data.pin] = PINMODE_OUTPUT_DIGITAL;
    if (data.IOmode == 'input') {
      pinMode[data.pin] += PINMODE_INPUT;
      device.pinInput(data.pin, function(error) {
        if (data.ADmode == 'analog') {
          pinMode[data.pin] += PINMODE_ANALOG;
          device.pinAnalog(data.pin, function(error) {
//            console.log('subscribe analog input: pinMode= %d', pinMode[data.pin]);
            subscribe(device, data);
          });
        } else {
          device.pinDigital(data.pin, function(error) {
//            console.log('subscribe digital input: pinMode= %d', pinMode[data.pin]);
            subscribe(device, data);
          });
        };
      });
    } else {
      device.pinOutput(data.pin, function(error) {
        if (data.ADmode == 'analog') {
          pinMode[data.pin] += PINMODE_ANALOG;
          device.pinAnalog(data.pin, function(error) {
            unsubscribe(device);
          });
        } else {
          device.pinDigital(data.pin, function(error) {
            unsubscribe(device);
          });
        }
      });
    }
  }
}
