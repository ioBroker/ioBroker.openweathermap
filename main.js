/* jshint -W097 */// jshint strict:false
/*jslint node: true */
'use strict';


const utils      = require(__dirname + '/lib/utils'); // Get common adapter utils
const request    = require('request');

const adapter = utils.Adapter('openweathermap');
const currentIds = [];
const forecastIds = [];
const tasks = [];

adapter.on('ready', main);

function processTasks() {
    if (tasks.length) {
        const task = tasks.shift();
        if (task.val !== undefined) {
            if (task.obj) {
                adapter.getObject(task.id, (err, obj) => {
                    if (!obj) {
                        obj = JSON.parse(JSON.stringify(task.obj));
                        obj._id = task.id;
                        obj.common.role = obj.common.role.replace(/\.\d+$/, '.' + task.day);
                        adapter.setObject(task.id, obj, err => {
                            adapter.setState(task.id, task.val, true, err => setImmediate(processTasks));
                        });
                    } else {
                        adapter.setState(task.id, task.val, true, err => setImmediate(processTasks));
                    }
                });
            } else {
                adapter.setState(task.id, task.val, true, err => setImmediate(processTasks));
            }
        } else if (task.obj !== undefined) {
            adapter.setObject(task.id, task.obj, err => setImmediate(processTasks));
        } else {
            adapter.log.error('Unknown task: ' + JSON.stringify(task));
            setImmediate(processTasks);
        }
    }
}

function extractValue(data, path, i) {
    if (typeof path === 'string') {
        path = path.split('.');
    }
    i = i || 0;
    if (data.hasOwnProperty(path[i])) {
        data = data[path[i]];
        if (i === path.length - 1) {
            return data;
        } else {
            if (typeof data === 'object') {
                return extractValue(data, path, i + 1);
            } else {
                return null;
            }
        }
    } else {
        return null;
    }
}

function extractValues(data, ids, day) {
    const result = {};
    for (let i = 0; i < ids.length; i++) {
        if (ids[i].native.path) {
            result[ids[i]._id.split('.').pop()] = extractValue(data, ids[i].native.path);
        }
    }
    if (result.precipitationRain === null && result.precipitationSnow === null) {
        result.precipitation = null;
    } else {
        result.precipitation = (result.precipitationRain || 0) + (result.precipitationSnow || 0);
    }

    result.icon = result.icon ? 'https://openweathermap.org/img/w/' + result.icon + '.png' : null;

    if (result.sunrise) {
        result.sunrise *= 1000;
    }
    if (result.sunset) {
        result.sunset *= 1000;
    }
    if (result.date) {
        result.date = result.date * 1000;
    }
    return result;
}

function parseCurrent(data) {
    const result = extractValues(data, currentIds);
    const isStart = !tasks.length;
    for (const attr in result) {
        if (!result.hasOwnProperty(attr)) continue;
        tasks.push({id: 'forecast.current.' + attr, val: result[attr]});
    }
    if (isStart) {
        processTasks();
    }
}

function calculateAverage(sum, day) {
    const counts = {};

    const result = {
    };
    for (let i = 0; i < sum.length; i++) {
        if (new Date(sum[i].date).getHours() >= 12) {
            if (!result.icon) {
                result.icon = sum[i].icon;
            }
            if (!result.state) {
                result.state = sum[i].state;
            }
            if (!result.title) {
                result.title = sum[i].title;
            }
            if (!result.date) {
                result.date = sum[i].date;
            }
        }

        if (result.temperatureMin === undefined || result.temperatureMin > sum[i].temperatureMin) {
            result.temperatureMin = sum[i].temperatureMin;
        }
        if (result.temperatureMax === undefined || result.temperatureMax < sum[i].temperatureMax) {
            result.temperatureMax = sum[i].temperatureMax;
        }
        result.clouds = result.clouds || 0;
        counts.clouds = counts.clouds || 0;
        if (sum[i].clouds !== null) {
            result.clouds += sum[i].clouds;
            counts.clouds++;
        }

        result.humidity = result.humidity || 0;
        counts.humidity = counts.humidity || 0;
        if (sum[i].humidity !== null) {
            result.humidity += sum[i].humidity;
            counts.humidity++;
        }

        result.pressure = result.pressure || 0;
        counts.pressure = counts.pressure || 0;
        if (sum[i].pressure !== null) {
            result.pressure += sum[i].pressure;
            counts.pressure++;
        }

        result.precipitationRain = result.precipitationRain || 0;
        counts.precipitationRain = counts.precipitationRain || 0;
        if (sum[i].precipitationRain !== null) {
            result.precipitationRain += sum[i].precipitationRain;
            counts.precipitationRain++;
        }

        result.precipitationSnow = result.precipitationSnow || 0;
        counts.precipitationSnow = counts.precipitationSnow || 0;
        if (sum[i].precipitationSnow !== null) {
            result.precipitationSnow += sum[i].precipitationSnow;
            counts.precipitationSnow++;
        }

        result.windDirection = result.windDirection || 0;
        counts.windDirection = counts.windDirection || 0;
        if (sum[i].windDirection !== null) {
            result.windDirection += sum[i].windDirection;
            counts.windDirection++;
        }

        if (result.windSpeed === undefined || result.windSpeed < sum[i].windSpeed) {
            result.windSpeed = sum[i].windSpeed;
        }
    }
    for (const attr in counts) {
        if (!counts.hasOwnProperty(attr)) continue;
        if (counts[attr]) {
            result[attr] = Math.round(result[attr] / counts[attr]);
        } else {
            result[attr] = null;
        }
    }

    if (!result.icon) {
        result.icon = sum[sum.length - 1].icon;
    }
    if (!result.state) {
        result.state = sum[sum.length - 1].state;
    }
    if (!result.title) {
        result.title = sum[sum.length - 1].title;
    }
    if (!result.date) {
        result.date = sum[sum.length - 1].date;
    }

    if (result.precipitationRain === null && result.precipitationSnow === null) {
        result.precipitation = null;
    } else {
        result.precipitation = (result.precipitationRain || 0) + (result.precipitationSnow || 0);
    }

    const isStart = !tasks.length;
    for (const attr in result) {
        if (!result.hasOwnProperty(attr)) continue;
        tasks.push({id: 'forecast.day' + day + '.' + attr, val: result[attr], obj: forecastIds.find(obj => obj._id.split('.').pop() === attr), day});
    }
    if (isStart) {
        processTasks();
    }
}

function parseForecast(data) {
    let sum = [];
    let date = null;
    let day = 0;
    for (let period = 0; period < data.list.length; period++) {
        const values = extractValues(data.list[period], forecastIds);
        const curDate = new Date(values.date).getDate();
        if (date === null) {
            sum.push(values);
            date = curDate;
        } else if (date !== curDate) {
            date = curDate;
            calculateAverage(sum, day);
            day++;
            sum = [values];
        } else {
            sum.push(values);
        }
    }
    if (sum.length) {
        calculateAverage(sum, day);
    }
}

function requestCurrent(query) {
    return new Promise((resolve, reject) => {
        const url = 'https://api.openweathermap.org/data/2.5/weather?';
        request(url + query, (error, result, body) => {
            if (body) {
                try  {
                    body = JSON.parse(body);
                } catch (e) {
                    return reject('Cannot parse answer: ' + e);
                }
            }
            if (!result || result.statusCode !== 200) {
                if (body) {
                    reject(body.message);
                } else {
                    reject('Error: ' + result.statusCode);
                }
            } else
            if (body) {
                parseCurrent(body);
                resolve();
            } else if (error) {
                reject('Error: ' + error);
            } else {
                reject('Error: no data received');
            }
        });
    });
}

function requestForecast(query) {
    return new Promise((resolve, reject) => {
        const url = 'https://api.openweathermap.org/data/2.5/forecast?';

        request(url + query, (error, result, body) => {
            if (body) {
                try  {
                    body = JSON.parse(body);
                } catch (e) {
                    return reject('Cannot parse answer: ' + e);
                }
            }
            if (!result || result.statusCode !== 200) {
                if (body) {
                    reject(body.message);
                } else {
                    reject('Error: ' + result.statusCode);
                }
            } else if (body) {
                parseForecast(body);
                resolve();
            } else if (error) {
                reject('Error: ' + error);
            } else {
                reject('Error: no data received');
            }
        });
    });
}

function checkUnits() {
    const isStart = !tasks.length;
    for (let i = 0; i < currentIds.length; i++) {
        if (!currentIds[i].native.imperial) continue;
        if (adapter.config.imperial) {
            if (currentIds[i].common.unit !== currentIds[i].native.imperial) {
                currentIds[i].common.unit = currentIds[i].native.imperial;
                tasks.push({id: currentIds[i]._id, obj: currentIds[i]});
            }
        } else {
            if (currentIds[i].common.unit !== currentIds[i].native.metric) {
                currentIds[i].common.unit = currentIds[i].native.metric;
                tasks.push({id: currentIds[i]._id, obj: currentIds[i]});
            }
        }
    }
    isStart && processTasks();
}

function stop() {
    if (!tasks.length) {
        adapter.stop()
    } else {
        setTimeout(() => stop(), 2000);
    }
}

function main() {
    let query = '';
    if (parseInt(adapter.config.location, 10).toString() === adapter.config.location) {
        query = 'id=' + adapter.config.location;
    } else if (adapter.config.location && adapter.config.location[0] >= '0' && adapter.config.location[0] <= '9') {
        const parts = adapter.config.location.split(',');
        query = 'lat=' + parts[0] + '&lon=' + parts[1];
    } else {
        query = 'q=' + encodeURIComponent(adapter.config.location);
    }
    adapter.config.language = adapter.config.language || 'en';

    adapter.config.location = (adapter.config.location || '').trim();
    query +=
        '&lang=' + adapter.config.language +
        '&APPID=' + adapter.config.apikey +
        '&units=' + (adapter.config.imperial ? 'imperial': 'metric');

    adapter.getStatesOf('forecast', '', (err, states) => {
        for (let s = 0; s < states.length; s++) {
            if (states[s].native.type === 'current') {
                currentIds.push(states[s]);
            } else if (states[s].native.type === 'forecast') {
                const m = states[s]._id.match(/\.day(\d+)\./);
                if (m && m[1] !== '0') continue;
                forecastIds.push(states[s]);
            }
        }

        checkUnits();

        if (adapter.config.location.startsWith('file:')) {
            const json = JSON.parse(require('fs').readFileSync(adapter.config.location));
            parseForecast(json);
            stop();
        } else {
            requestCurrent(query)
                .then(() => requestForecast(query))
                .catch(e => adapter.log.error(e))
                .then(() => {
                    stop();
                });

        }
    });
}
