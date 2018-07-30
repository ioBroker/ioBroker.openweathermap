/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';

const xml2js     = require('xml2js');
const http       = require('http');
const utils      = require(__dirname + '/lib/utils'); // Get common adapter utils
const dictionary = require(__dirname + '/lib/words');

const adapter = utils.Adapter({
    name:          'yr',       // adapter name
    useFormatDate:  true       // read date format from config
});

adapter.on('ready', main);

function main() {
    const tmp  = adapter.config.location.split('/');
    const city = decodeURI(tmp.pop());

    adapter.config.language = adapter.config.language || 'en';
    if (adapter.config.sendTranslations === undefined) adapter.config.sendTranslations = true;
    if (adapter.config.sendTranslations === 'true')  adapter.config.sendTranslations = true;
    if (adapter.config.sendTranslations === 'false') adapter.config.sendTranslations = false;

    adapter.getObject('forecast.day0.temperatureActual', (err, obj) => {
        if (obj && obj.common && obj.common.unit) {
            if (obj.common.unit === '°C' && adapter.config.nonMetric) {
                obj.common.unit = '°F';
                adapter.setObject(obj._id, obj, () => {
                    adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                });
            } else if (obj.common.unit !== '°C' && !adapter.config.nonMetric) {
                obj.common.unit = '°C';
                adapter.setObject(obj._id, obj, () => {
                    adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                });
            }
        }
    });

    for (let d = 0; d < 3; d++) {
        adapter.getObject('forecast.day' + d + '.windSpeed',      (err, obj) => {
            if (obj && obj.common && obj.common.unit) {
                if (obj.common.unit === 'km/h' && adapter.config.nonMetric) {
                    obj.common.unit = 'm/h';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                } else if (obj.common.unit !== 'km/h' && !adapter.config.nonMetric) {
                    obj.common.unit = 'km/h';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                }
            }
        });
        adapter.getObject('forecast.day' + d + '.temperatureMin', (err, obj) => {
            if (obj && obj.common && obj.common.unit) {
                if (obj.common.unit === '°C' && adapter.config.nonMetric) {
                    obj.common.unit = '°F';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                } else if (obj.common.unit !== '°C' && !adapter.config.nonMetric) {
                    obj.common.unit = '°C';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                }
            }
        });
        adapter.getObject('forecast.day' + d + '.temperatureMax', (err, obj) => {
            if (obj && obj.common && obj.common.unit) {
                if (obj.common.unit === '°C' && adapter.config.nonMetric) {
                    obj.common.unit = '°F';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                } else if (obj.common.unit !== '°C' && !adapter.config.nonMetric) {
                    obj.common.unit = '°C';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                }
            }
        });
        adapter.getObject('forecast.day' + d + '.precipitation',  (err, obj) => {
            if (obj && obj.common && obj.common.unit) {
                if (obj.common.unit === 'mm' && adapter.config.nonMetric) {
                    obj.common.unit = 'in';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                } else if (obj.common.unit !== 'mm' && !adapter.config.nonMetric) {
                    obj.common.unit = 'mm';
                    adapter.setObject(obj._id, obj, () => {
                        adapter.log.info(`Metrics changed for ${obj._id} to ${obj.common.unit}`);
                    });
                }
            }
        });
    }

    adapter.getObject('forecast', (err, obj) => {
        if (!obj || !obj.common || obj.common.name !== 'yr.no forecast ' + city) {
            adapter.setObject('forecast', {
                type: 'device',
                role: 'forecast',
                common: {
                    name: 'yr.no forecast ' + city
                },
                native: {
                    url:     adapter.config.location,
                    country: decodeURI(tmp[0]),
                    state:   decodeURI(tmp[1]),
                    city:    city
                }
            });
        }
    });

    if (adapter.config.location.indexOf('forecast.xml') === -1) {
        if (adapter.config.location.indexOf('%') === -1) adapter.config.location = encodeURI(adapter.config.location);

        adapter.setState('forecast.info.diagram', 'http://www.yr.no/place/' + adapter.config.location + '/avansert_meteogram.png', true);

        const reqOptions = {
            hostname: 'www.yr.no',
            port:     80,
            path:     '/place/' + adapter.config.location + '/forecast.xml',
            method:   'GET'
        };

        adapter.log.debug('get http://' + reqOptions.hostname + reqOptions.path);

        const req = http.request(reqOptions, res => {
            let data = '';

            res.on('data', chunk => data += chunk);

            res.on('end', () => {
                adapter.log.debug('received data from yr.no');
                parseData(data.toString());
            });
        });

        req.on('error', e => {
            adapter.log.error(e.message);
            parseData(null);
        });

        req.end();
    } else {
        parseData(require('fs').readFileSync(adapter.config.location).toString());
    }

    // Force terminate after 5min
    setTimeout(() => {
        adapter.log.error('force terminate');
        process.exit(1);
    }, 300000);
}

function _(text) {
    if (!text) return '';

    if (dictionary[text]) {
        let newText = dictionary[text][adapter.config.language];
        if (newText) {
            return newText;
        } else if (adapter.config.language !== 'en') {
            newText = dictionary[text].en;
            if (newText) {
                return newText;
            }
        }
    } else {
        if (adapter.config.sendTranslations) {
            const options = {
                hostname: 'download.iobroker.net',
                port: 80,
                path: '/yr.php?word=' + encodeURIComponent(text)
            };
            const req = http.request(options, res => {
                console.log('STATUS: ' + res.statusCode);
                adapter.log.info('Missing translation sent to iobroker.net: "' + text + '"');
            });
            req.on('error', e => {
                adapter.log.error('Cannot send to server missing translation for "' + text + '": ' + e.message);
            });
            req.end();
        } else {
            adapter.log.warn('Translate: "' + text + '": {"en": "' + text + '", "de": "' + text + '", "ru": "' + text + '"}, please send to developer');
        }
    }
    return text;
}

function celsius2fahrenheit(degree, isConvert) {
    if (isConvert) {
        return degree * 9 / 5 + 32;
    } else {
        return degree;
    }
}

function parseData(xml) {
    if (!xml) {
        setTimeout(() => process.exit(0), 5000);
        return;
    }
    const options = {
        explicitArray: false,
        mergeAttrs: true
    };
    const parser = new xml2js.Parser(options);
    parser.parseString(xml, (err, result) => {
        if (err) {
            adapter.log.error(err);
        } else {
            adapter.log.info('got weather data from yr.no');
            const forecastArr = result.weatherdata.forecast.tabular.time;

            let tableDay =      '<table style="border-collapse: collapse; padding: 0; margin: 0"><tr class="yr-day">';
            let tableHead =     '</tr><tr class="yr-time">';
            let tableMiddle =   '</tr><tr class="yr-img">';
            let tableBottom =   '</tr><tr class="yr-temp">';
            const dateObj = new Date();
            const dayEnd = dateObj.getFullYear() + '-' + ('0' + (dateObj.getMonth() + 1)).slice(-2) + '-' + ('0' + dateObj.getDate()).slice(-2) + 'T24:00:00';
            let daySwitch = false;

            let day = -1; // Start from today
            const days = [];
            for (let i = 0; i < 12 && i < forecastArr.length; i++) {
                const period = forecastArr[i];

                if (!period.period || period.period === '0') day++;

                // We want to process only today, tomorrow and the day after tomorrow
                if (day === 3) break;
				period.symbol.url         = '/adapter/yr/icons/' + period.symbol.var + '.svg';
                period.symbol.name        = _(period.symbol.name);
                period.windDirection.code = _(period.windDirection.code);
                period.windDirection.name = _(period.windDirection.name);

                if (i < 8) {
                    switch (i) {
                        case 0:
                            tableHead += '<td>' + _('Now') + '</td>';
                            break;
                        default:
                            if (period.from > dayEnd) {
                                if (!daySwitch) {
                                    daySwitch = true;
                                    tableDay += '<td colspan="' + i + '">' + _('Today') + '</td><td colspan="4">' + _('Tomorrow') + '</td>';
                                    if (i < 3) tableDay += '<td colspan="' + (4 - i) + '">' + _('After tomorrow') + '</td>';
                                    tableHead += '<td>' + parseInt(period.from.substring(11, 13), 10).toString() + '-' + parseInt(period.to.substring(11, 13), 10).toString() + '</td>';
                                } else {
                                    tableHead += '<td>' + parseInt(period.from.substring(11, 13), 10).toString() + '-' + parseInt(period.to.substring(11, 13), 10).toString() + '</td>';
                                }

                            } else {
                                tableHead += '<td>' + parseInt(period.from.substring(11, 13), 10).toString() + '-' + parseInt(period.to.substring(11, 13), 10).toString() + '</td>';
                            }
                    }

                    tableMiddle += '<td><img style="position: relative;margin: 0;padding: 0;left: 0;top: 0;width: 38px;height: 38px;" src="' + period.symbol.url + '" alt="' + period.symbol.name + '" title="' + period.symbol.name + '"><br/>';
                    tableBottom += '<td><span class="">' + period.temperature.value + '°C</span></td>';
                }

                if (day === -1 && !i) day = 0;
                if (!days[day]) {
                    days[day] = {
                        date:                new Date(period.from),
                        icon:                period.symbol.url,
                        state:               period.symbol.name,
                        temperatureMin:      celsius2fahrenheit(parseFloat(period.temperature.value), adapter.config.nonMetric),
                        temperatureMax:      celsius2fahrenheit(parseFloat(period.temperature.value), adapter.config.nonMetric),
                        precipitation:  adapter.config.nonMetric ? parseFloat(period.precipitation.value) / 25.4 : parseFloat(period.precipitation.value),
                        windDirection:       period.windDirection.code,
                        windSpeed:           adapter.config.nonMetric ? parseFloat(period.windSpeed.mps) : parseFloat(period.windSpeed.mps) * 3.6,
                        pressure:            parseFloat(period.pressure.value),
                        count:               1
                    };
                } else {
                    // Summarize
                    let t;
                    // Take icon for day always from 12:00 to 18:00 if possible
                    if (i === 2) {
                        days[day].icon  = period.symbol.url;
                        days[day].state = period.symbol.name;
                        days[day].windDirection = period.windDirection.code;
                    }
                    t = celsius2fahrenheit(parseFloat(period.temperature.value), adapter.config.nonMetric);
                    if (t < days[day].temperatureMin) {
                        days[day].temperatureMin = t;
                    } else
                    if (t > days[day].temperatureMax) {
                        days[day].temperatureMax = t;
                    }

                    days[day].precipitation  += adapter.config.nonMetric ? parseFloat(period.precipitation.value) / 25.4 : parseFloat(period.precipitation.value);
                    days[day].windSpeed           += adapter.config.nonMetric ? parseFloat(period.windSpeed.mps) : parseFloat(period.windSpeed.mps) * 3.6;
                    days[day].pressure            += parseFloat(period.pressure.value);
                    days[day].count++;
                }
                // Set actual temperature
                if (!day && !i) {
                    days[day].temperatureActual = celsius2fahrenheit(parseInt(period.temperature.value, 10), adapter.config.nonMetric);
                }
            }
            const style = '<style type="text/css">tr.yr-day td {font-family: sans-serif; font-size: 9px; padding:0; margin: 0;}\ntr.yr-time td {text-align: center; font-family: sans-serif; font-size: 10px; padding:0; margin: 0;}\ntr.yr-temp td {text-align: center; font-family: sans-serif; font-size: 12px; padding: 0; margin: 0;}\ntr.yr-img td {text-align: center; padding: 0; margin: 0;}</style>';
            const table = style + tableDay + tableHead + tableMiddle + tableBottom + '</tr></table>';
            //console.log(JSON.stringify(result, null, "  "));

            for (day = 0; day < days.length; day++) {
                // Take the average
                if (days[day].count > 1) {
                    days[day].precipitation /= days[day].count;
                    days[day].windSpeed          /= days[day].count;
                    days[day].pressure           /= days[day].count;
                }
                days[day].temperatureMin = Math.round(days[day].temperatureMin);
                days[day].temperatureMax = Math.round(days[day].temperatureMax);
                days[day].precipitation  = Math.round(days[day].precipitation);
                days[day].windSpeed      = Math.round(days[day].windSpeed * 10) / 10;
                days[day].pressure       = Math.round(days[day].pressure);

                days[day].date = adapter.formatDate(days[day].date);

                delete days[day].count;
                for (const name in days[day]) {
                    if (days[day].hasOwnProperty(name)) {
                        adapter.setState('forecast.day' + day + '.' + name, {val: days[day][name], ack: true});
                    }
                }
            }
                       
            adapter.log.debug('data successfully parsed. setting states');

            adapter.setState('forecast.info.html',   {val: table, ack: true});
            adapter.setState('forecast.info.object', {val: JSON.stringify(days),  ack: true}, () => {
                setTimeout(() => process.exit(0), 5000);
            });
        }
    });
}
