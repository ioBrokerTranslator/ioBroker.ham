/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';
const expect = require('chai').expect;
const setup  = require(__dirname + '/lib/setup');
const request = require('request');
const http = require('http');

let objects = null;
let states  = null;
let onStateChanged = null;
let onObjectChanged = null;
let sendToID = 1;

const adapterShortName = setup.adapterName.substring(setup.adapterName.indexOf('.')+1);

let httpServer;
let lastHTTPRequest = null;

function setupHTTPServer(port, callback) {
    httpServer = http.createServer(function (req, res) {
        lastHTTPRequest = req.url;
        console.log('HTTP Received: ' + lastHTTPRequest);
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('OK');
    }).listen(port);
    setTimeout(function() {
        callback();
    }, 5000);
}

function checkConnectionOfAdapter(cb, counter) {
    counter = counter || 0;
    console.log('Try check #' + counter);
    if (counter > 30) {
        if (cb) cb('Cannot check connection');
        return;
    }

    states.getState('system.adapter.' + adapterShortName + '.0.alive', (err, state) => {
        if (err) console.error(err);
        if (state && state.val) {
            if (cb) cb();
        } else {
            setTimeout(function () {
                checkConnectionOfAdapter(cb, counter + 1);
            }, 1000);
        }
    });
}

function checkValueOfState(id, value, cb, counter) {
    counter = counter || 0;
    if (counter > 20) {
        if (cb) cb('Cannot check value Of State ' + id);
        return;
    }

    states.getState(id, (err, state) => {
        if (err) console.error(err);
        if (value === null && !state) {
            if (cb) cb();
        } else
        if (state && (value === undefined || state.val === value)) {
            if (cb) cb();
        } else {
            setTimeout(function () {
                checkValueOfState(id, value, cb, counter + 1);
            }, 500);
        }
    });
}

function sendTo(target, command, message, callback) {
    onStateChanged =  (id, state) => (id === 'messagebox.system.adapter.test.0') && callback(state.message);

    states.pushMessage('system.adapter.' + target, {
        command:    command,
        message:    message,
        from:       'system.adapter.test.0',
        callback: {
            message: message,
            id:      sendToID++,
            ack:     false,
            time:    Date.now()
        }
    });
}

describe('Test ' + adapterShortName + ' Local adapter', () => {
    before('Test ' + adapterShortName + ' Local adapter: Start js-controller', function (_done) {
        this.timeout(600000); // because of first install from npm

        setup.setupController(() => {
            const config = setup.getAdapterConfig();
            // enable adapter
            config.common.enabled  = true;
            config.common.loglevel = ((process.env.TRAVIS && process.env.TRAVIS === 'true') || (process.env.APPVEYOR && process.env.APPVEYOR === 'True')) ? 'info' : 'debug';

            config.native.useLocalHomebridge = true;
            config.native.libraries = "homebridge-http-webhooks homebridge-sun-position";
            config.native.ignoreInfoAccessoryServices = false;
            config.native.characteristicPollingInterval = 30;
            config.native.wrapperConfig = {
                "bridge": {
                    "name": "Test-Bridge",
                    "username": "EE:22:3D:E3:CE:30",
                    "port": 61826,
                    "pin": "031-45-156"
                },

                "description": "This is an example configuration file with one fake accessory and one fake platform. You can use this as a template for creating your own configuration file containing devices you actually own.",

                "accessories": [
                    {
                        "accessory": "SunPosition",
                        "name": "Sun",
                        "location": {
                            "lat": 49.035924,
                            "long": 8.345736
                        }
                    }
                ],

                "platforms": [
                    {
                        "platform": "HttpWebHooks",
                        "webhook_port": "61828",
                        "cache_directory": "./.node-persist/storage",
                        "sensors": [
                            {
                                "id": "sensor1",
                                "name": "Sensor name 1",
                                "type": "contact"
                            },
                            {
                                "id": "sensor2",
                                "name": "Sensor name 2",
                                "type": "motion"
                            },
                            {
                                "id": "sensor3",
                                "name": "Sensor name 3",
                                "type": "occupancy"
                            },
                            {
                                "id": "sensor4",
                                "name": "Sensor name 4",
                                "type": "smoke"
                            },
                            {
                                "id": "sensor5",
                                "name": "Sensor name 5",
                                "type": "temperature"
                            },
                            {
                                "id": "sensor6",
                                "name": "Sensor name 6",
                                "type": "humidity"
                            },
                            {
                                "id": "sensor7",
                                "name": "Sensor name 7",
                                "type": "airquality"
                            },
                            {
                                "id": "sensor8",
                                "name": "Sensor name 8",
                                "type": "airquality"
                            }
                        ],
                        "switches": [
                            {
                                "id": "switch1",
                                "name": "Switch name 1",
                                "on_url": "http://localhost:9080/switch1?on",
                                "on_method": "GET",
                                "off_url": "http://localhost:9080/switch1?off",
                                "off_method": "GET"
                            },
                            {
                                "id": "switch2",
                                "name": "Switch name 2",
                                "on_url": "http://localhost:9080/switch2?on",
                                "on_method": "GET",
                                "off_url": "http://localhost:9080/switch2?off",
                                "off_method": "GET"
                            },
                            {
                                "id": "switch3",
                                "name": "Switch name 3",
                                "on_url": "http://localhost:9080/switch3?on",
                                "on_method": "GET",
                                "off_url": "http://localhost:9080/switch3?off",
                                "off_method": "GET"
                            },
                            {
                                "id": "switch4",
                                "name": "Switch name*3",
                                "on_url": "http://localhost:9080/switch3-2?on",
                                "on_method": "GET",
                                "off_url": "http://localhost:9080/switch3-2?off",
                                "off_method": "GET"
                            }
                        ],
                        "pushbuttons": [
                            {
                                "id": "pushbutton1",
                                "name": "Push button name 1",
                                "push_url": "http://localhost:9080/pushbutton1?push",
                                "push_method": "GET"
                            }
                        ],
                        "lights": [
                            {
                                "id": "light1",
                                "name": "Light name 1",
                                "on_url": "http://localhost:9080/light1?on",
                                "on_method": "GET",
                                "off_url": "http://localhost:9080/light1?off",
                                "off_method": "GET"
                            }
                        ],
                        "thermostats": [
                            {
                                "id": "thermostat1",
                                "name": "Thermostat name 1",
                                "set_target_temperature_url": "http://localhost:9080/thermostat1?targettemperature=%f",
                                "set_target_heating_cooling_state_url": "http://localhost:9080/thermostat1??targetstate=%b"
                            }
                        ],
                        "outlets": [
                            {
                                "id": "outlet1",
                                "name": "Outlet name 1",
                                "on_url": "http://localhost:9080/outlet1?on",
                                "on_method": "GET",
                                "off_url": "http://localhost:9080/outlet1?off",
                                "off_method": "GET"
                            }
                        ]
                    }
                ]
            };

            setup.setAdapterConfig(config.common, config.native);

            setupHTTPServer(9080, () => {
                setup.startController(true,
                    (id, obj) => {},
                    (id, state) => onStateChanged && onStateChanged(id, state),
                    (_objects, _states) => {
                        objects = _objects;
                        states  = _states;
                        _done();
                    });
            });
        });
    });

/*
    ENABLE THIS WHEN ADAPTER RUNS IN DEAMON MODE TO CHECK THAT IT HAS STARTED SUCCESSFULLY
*/
    it('Test ' + adapterShortName + ' Local adapter: Check if adapter started', done => {
        checkConnectionOfAdapter(res => {
            if (res) console.log(res);
            expect(res).not.to.be.equal('Cannot check connection');
            objects.setObject('system.adapter.test.0', {
                    common: {

                    },
                    type: 'instance'
                },
                () => {
                    states.subscribeMessage('system.adapter.test.0');
                    done();
                });
        });
    }).timeout(60000);

    it('Test ' + adapterShortName + ' Wrapper adapter: Wait for init', done => {
        setTimeout(() => done(), 69000);
    }).timeout(70000);

    it('Test ' + adapterShortName + ' Wrapper: Verify Init', done => {
        states.getState(adapterShortName + '.0.Switch-name-1.Switch-name-1.On', (err, state) => {
            expect(err).to.not.exist;
            expect(state.val).to.be.false;

            states.getState(adapterShortName + '.0.Sun.Accessory-Information.Model', (err, state) => {
                expect(err).to.not.exist;
                expect(state.val).to.be.equal('Sun Position');

                states.getState(adapterShortName + '.0.Sun.Sun.Altitude', (err, state) => {
                    expect(err).to.not.exist;
                    expect(state.val).to.exist;
                    done();
                });
            });
        });
    });

    it('Test ' + adapterShortName + ' Wrapper: Test Change from inside', done => {
        request('http://localhost:61828/?accessoryId=switch1&state=true', (error, response, body) => {
            expect(error).to.be.null;
            expect(response && response.statusCode).to.be.equal(200);

            setTimeout(function() {
                expect(lastHTTPRequest).to.be.null;
                states.getState(adapterShortName + '.0.Switch-name-1.Switch-name-1.On', (err, state) => {
                    expect(err).to.not.exist;
                    expect(state.val).to.be.true;
                    done();
                });
            }, 3000);
        });
    }).timeout(10000);

    it('Test ' + adapterShortName + ' Wrapper: Test change via characteristic', done => {
        states.setState(adapterShortName + '.0.Switch-name-1.Switch-name-1.On', {val: false, ack: false}, err => {
            expect(err).to.not.exist;

            setTimeout(function() {
                expect(lastHTTPRequest).to.be.equal('/switch1?off');
                states.getState(adapterShortName + '.0.Switch-name-1.Switch-name-1.On', (err, state) => {
                    expect(err).to.not.exist;
                    expect(state.val).to.be.false;
                    done();
                });
            }, 3000);
        });
    }).timeout(10000);

    it('Test ' + adapterShortName + ' Wrapper: Test change via characteristic 2', done => {
        states.setState(adapterShortName + '.0.Switch-name-1.Switch-name-1.On', {val: true, ack: false}, err => {
            expect(err).to.not.exist;

            setTimeout(function() {
                expect(lastHTTPRequest).to.be.equal('/switch1?on');
                states.getState(adapterShortName + '.0.Switch-name-1.Switch-name-1.On', (err, state) => {
                    expect(err).to.not.exist;
                    expect(state.val).to.be.true;
                    done();
                });
            }, 3000);
        });
    }).timeout(10000);

    it('Test ' + adapterShortName + ' Wrapper: Test Change from inside 2', done => {
        lastHTTPRequest = null;
        request('http://localhost:61828/?accessoryId=switch1&state=false', (error, response, body) => {
            expect(error).to.be.null;
            expect(response && response.statusCode).to.be.equal(200);

            setTimeout(function() {
                expect(lastHTTPRequest).to.be.null;
                states.getState(adapterShortName + '.0.Switch-name-1.Switch-name-1.On', (err, state) => {
                    expect(err).to.not.exist;
                    expect(state.val).to.be.false;
                    done();
                });
            }, 3000);
        });
    }).timeout(10000);

    after('Test ' + adapterShortName + ' Local adapter: Stop js-controller', function (done) {
        this.timeout(12000);

        setup.stopController(function (normalTerminated) {
            console.log('Adapter normal terminated: ' + normalTerminated);
            httpServer.close();
            setTimeout(done, 2000);
        });
    });
});
