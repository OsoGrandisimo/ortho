#!/usr/bin/env node
// bonescript object and required things
var b = require('bonescript');
var app = require('http').createServer(handler);
var io = require('/home/debian/node_modules/socket.io').listen(app);
var fs = require('fs');

/** Initializing pinMode and initial state **/
b.pinMode('P8_8', b.OUTPUT);
b.digitalWrite('P8_8', b.HIGH);
b.pinMode('P8_10', b.OUTPUT);
b.digitalWrite('P8_10', b.HIGH);
b.pinMode('P8_12', b.OUTPUT);
b.digitalWrite('P8_12', b.HIGH);
b.pinMode('P8_14', b.OUTPUT);
b.digitalWrite('P8_14', b.HIGH);
console.log("Pins Initialized");

/** Device Declaration **/
// Devices per pin
var ledPin = 'P8_8';
var motorPin = 'P8_10';
var valvePin = 'P8_12';
var pumpPin = 'P8_14';
// Used for monitoring pin states
var pinStates = {};
pinStates[ledPin]=1;
pinStates[motorPin]=1;
pinStates[valvePin]=1;
pinStates[pumpPin]=1;


/** html page to be used **/
var htmlPage = 'index.html';

//soc provides a handle for the socket connection to the browser
var soc;

//operate on the 8085 port of server
//192.168.7.2:8085
app.listen(8085);


/** handler **/
// Handles incoming web requests. When it receives a request, the contents are
//   read into the htmlPage variable and sends it to the browser
function handler(req, res) {
    // The call to readfile (specifies a callback for the read being completed)
    //  the second parameter is the callback function
    fs.readFile(htmlPage, function(err, data) {
        // if there is an error (usually by html page being absent)
        if (err) {
            //write the error
            res.writeHead(500);
            return res.end('Error loading file: ' + htmlPage);
        }
        //tells browser that the page is okay (status code 200)
        res.writeHead(200);
        //ends the request and sends the whole contents of the file
        res.end(data);
    });
    console.log("In handler");
}

/** onConnect **/
// Specify the commands you are prepared to handle and associate them with a function
function onConnect(socket) {
    socket.on('systemStop', handleSystemStop);
    socket.on('systemStart', handleSystemStart);
    soc = socket;
    console.log("In onConnect");
}

/** handleSystemStop() **/
//  Handles the command from the browser to shut down all components
function handleSystemStop()
{
    console.log("In handleSystemStop");
    b.digitalWrite('P8_8', b.HIGH);
    b.digitalWrite('P8_10', b.HIGH);
    b.digitalWrite('P8_12', b.HIGH);
    b.digitalWrite('P8_14', b.HIGH);
}

/** handleSystemStart **/
//  Handles starting the system when given certain parameters
function handleSystemStart(data)
{
    isRunning=true;
    console.log("In handleSystemStart");
    console.log("LED Start Val " + data.ledStart);
    console.log("LED Duration Val " + data.ledDuration);
    console.log("Motor Start Val " + data.motorStart);
    console.log("Motor Duration Val " + data.motorDuration);
    console.log("Valve Start Val " + data.valveStart);
    console.log("Valve Duration Val " + data.valveDuration);
    console.log("Pump Start Val " + data.pumpStart);
    console.log("Pump Duration Val " + data.pumpDuration);
    //start delay logic
    ledTimer=setTimeout(startComponent,data.ledStart * 1000,'led',data.ledDuration);
    motorTimer=setTimeout(startComponent,data.motorStart * 1000,'motor',data.motorDuration);
    valveTimer=setTimeout(startComponent,data.valveStart * 1000,'valve',data.valveDuration);
    pumpTimer=setTimeout(startComponent,data.pumpStart * 1000,'pump',data.pumpDuration);
}

/** startComponent **/
//starts a specific device for a certain duration
function startComponent(device, duration)
{
    console.log("Starting " + device + " from start component function with duration " + duration);
    if(device == 'led')
    {
        b.digitalWrite(ledPin, b.LOW);
        pinStates[ledPin]=0;
        setTimeout(stopComponent, duration*1000, 'led');
    }
    else if(device == 'motor')
    {
        b.digitalWrite(motorPin, b.LOW);
        pinStates[motorPin]=0;
        setTimeout(stopComponent, duration*1000,'motor');
    }
    else if(device == 'valve')
    {
        b.digitalWrite(valvePin, b.LOW);
        pinStates[valvePin]=0;
        setTimeout(stopComponent, duration*1000,'valve');
    }
    else if(device == 'pump')
    {
        b.digitalWrite(pumpPin, b.LOW);
        pinStates[pumpPin]=0;
        setTimeout(stopComponent, duration*1000,'pump');
    }
}

/** stopComponent **/
// Stops a specific component
function stopComponent(device)
{
    if(device == 'led')
    {
        b.digitalWrite(ledPin, b.HIGH);
        pinStates[ledPin]=1;
        console.log("Stopped LED from stopComponent");
    }
    else if(device == 'motor')
    {
        b.digitalWrite(motorPin, b.HIGH);
        pinStates[motorPin]=1;
        console.log("Stopped motor from stopComponent");
    }
    else if(device == 'valve')
    {
        b.digitalWrite(valvePin, b.HIGH);
        pinStates[valvePin]=1;
        console.log("Stopped valve from stopComponent");
    }
    else if(device == 'pump')
    {
        b.digitalWrite(pumpPin, b.HIGH);
        pinStates[pumpPin]=1;
        console.log("Stopped pump from stopComponent");
    }
}

/** sendOutputs **/
function sendOutputs()
{
    if (soc == undefined)
    {
        return;
    }
    soc.emit("pinUpdate",'{"pin":"' + ledPin + '","value":' + pinStates[ledPin] + '}');
    soc.emit("pinUpdate",'{"pin":"' + motorPin + '","value":' + pinStates[motorPin] + '}');
    soc.emit("pinUpdate",'{"pin":"' + valvePin + '","value":' + pinStates[valvePin] + '}');
    soc.emit("pinUpdate",'{"pin":"' + pumpPin + '","value":' + pinStates[pumpPin] + '}');
}
//Setting send interval
setInterval(sendOutputs, 50);

// Ensures that onConnect gets called when communication is established
io.sockets.on('connection', onConnect);