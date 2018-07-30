const expect  = require('chai').expect;
const setup   = require(__dirname + '/lib/setup');
let name    = __dirname.replace(/\\/g, '/').split('/');
name = name[name.length - 2].split('.')[1];

let objects = null;
let states  = null;
let onStateChanged = null;
let onObjectChanged = null;

function checkConnectionOfAdapter(cb, counter) {
    counter = counter || 0;
    if (counter > 20) {
        cb && cb('Cannot check connection');
        return;
    }

    states.getState('system.adapter.' + name + '.0.alive', function (err, state) {
        if (err) console.error(err);
        if (state && state.val) {
            cb && cb();
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
        cb && cb('Cannot check value Of State ' + id);
        return;
    }

    states.getState(id, function (err, state) {
        if (err) console.error(err);
        if (value === null && !state) {
            cb && cb();
        } else
        if (state && (value === undefined || state.val === value)) {
            cb && cb();
        } else {
            setTimeout(function () {
                checkValueOfState(id, value, cb, counter + 1);
            }, 500);
        }
    });
}

describe('Test ' + name, function () {
    before('Test ' + name + ': Start js-controller', function (_done) {
        this.timeout(600000); // because of first install from npm
        setup.setupController(function () {
            const config = setup.getAdapterConfig();
            // enable adapter
            config.common.enabled  = true;
            config.common.loglevel = 'debug';

            config.native.location = __dirname + '/lib/forecast.xml';
            config.native.language = '';
            config.native.sendTranslations = false;

            setup.setAdapterConfig(config.common, config.native);

            setup.startController(true, function (id, obj) {
                    if (onObjectChanged) onObjectChanged(id, obj);
                }, function (id, state) {
                    console.log(id + ': ' + state.val);
                    if (onStateChanged) onStateChanged(id, state);
                },
                function (_objects, _states) {
                    objects = _objects;
                    states  = _states;
                    states.subscribe('*');
                    objects.subscribe('*');
                    _done();
                });
        });
    });

    it('Test ' + name + ': Check if adapter started', function (done) {
        this.timeout(5000);
        checkConnectionOfAdapter(done);
    });

    it('Test ' + name + ': channel must have name of city', function (done) {
        setTimeout(function () {
            objects.getObject('yr.0.forecast', function (err, obj) {
                expect(err).to.be.not.ok;
                expect(obj).to.be.ok;
                expect(obj.common.name).to.be.equal('yr.no forecast forecast.xml');
                done();
            });
        }, 500);
    });

    it('Test ' + name + ': check states', function (done) {
        this.timeout(5000);

        setTimeout(function () {
            states.getState('yr.0.forecast.day0.temperatureMin', function (err, state) {
                expect(err).to.be.not.ok;
                expect(state).to.be.ok;
                expect(state.val).to.be.not.undefined;
                expect(state.val).to.be.a('number');

                states.getState('yr.0.forecast.day0.temperatureMax', function (err, state) {
                    expect(err).to.be.not.ok;
                    expect(state).to.be.ok;
                    expect(state.val).to.be.not.undefined;
                    expect(state.val).to.be.a('number');

                    states.getState('yr.0.forecast.day0.temperatureActual', function (err, state) {
                        expect(err).to.be.not.ok;
                        expect(state).to.be.ok;
                        expect(state.val).to.be.not.undefined;
                        expect(state.val).to.be.a('number');
                        done();
                    });
                });
            });
        }, 100);
    });

    after('Test ' + name + ': Stop js-controller', function (done) {
        this.timeout(7000);

        setup.stopController(function (normalTerminated) {
            console.log('Adapter normal terminated: ' + normalTerminated);
            done();
        });
    });
});