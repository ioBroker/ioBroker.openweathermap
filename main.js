/* jshint -W097 */
/* jshint strict: false */
/* jslint node: true */
'use strict';

const utils = require('@iobroker/adapter-core');
const request = require('request');
const adapterName = require('./package.json').name.split('.').pop();

class Openweathermap extends utils.Adapter {

    constructor(options) {
        super({
            ...options,
            name: adapterName,
        });

        this.currentIds = [];
        this.forecastIds = [];
        this.tasks = [];

        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        let query = '';
        if (parseInt(this.config.location, 10).toString() === this.config.location) {
            query = 'id=' + this.config.location;
        } else if (this.config.location && this.config.location[0] >= '0' && this.config.location[0] <= '9') {
            const parts = this.config.location.split(',');
            query = 'lat=' + parts[0] + '&lon=' + parts[1];
        } else {
            query = 'q=' + encodeURIComponent(this.config.location);
        }
        this.config.language = this.config.language || 'en';
    
        this.config.location = (this.config.location || '').trim();
        query +=
            '&lang=' + this.config.language +
            '&APPID=' + this.config.apikey +
            '&units=' + (this.config.imperial ? 'imperial': 'metric');
    
        this.getStatesOf('forecast', '', (err, states) => {
            for (let s = 0; s < states.length; s++) {
                if (states[s].native.type === 'current') {
                    this.currentIds.push(states[s]);
                } else if (states[s].native.type === 'forecast') {
                    const m = states[s]._id.match(/\.day(\d+)\./);
                    if (m && m[1] !== '0') continue;
                    this.forecastIds.push(states[s]);
                }
            }
    
            this.checkUnits();
    
            if (this.config.location.startsWith('file:')) {
                const json = JSON.parse(require('fs').readFileSync(this.config.location));
                this.parseForecast(json);
                this.end();
            } else {
                this.requestCurrent(query)
                    .then(() => this.requestForecast(query))
                    .catch(e => this.log.error(e))
                    .then(() => {
                        this.end();
                    });
    
            }
        });
    }

    processTasks() {
        if (this.tasks.length) {
            const task = this.tasks.shift();
            if (task.val !== undefined) {
                if (task.obj) {
                    this.getObject(task.id, (err, obj) => {
                        if (!obj) {
                            obj = JSON.parse(JSON.stringify(task.obj));
                            obj._id = task.id;
                            obj.common.role = obj.common.role.replace(/\.\d+$/, '.' + task.day);
                            this.setObject(task.id, obj, err => {
                                this.setState(task.id, task.val, true, err => setImmediate(this.processTasks));
                            });
                        } else {
                            this.setState(task.id, task.val, true, err => setImmediate(this.processTasks));
                        }
                    });
                } else {
                    this.setState(task.id, task.val, true, err => setImmediate(this.processTasks));
                }
            } else if (task.obj !== undefined) {
                this.setObject(task.id, task.obj, err => setImmediate(this.processTasks));
            } else {
                this.log.error('Unknown task: ' + JSON.stringify(task));
                setImmediate(this.processTasks);
            }
        }
    }
    
    extractValue(data, path, i) {
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
                    return this.extractValue(data, path, i + 1);
                } else {
                    return null;
                }
            }
        } else {
            return null;
        }
    }
    
    extractValues(data, ids, day) {
        const result = {};
        for (let i = 0; i < ids.length; i++) {
            if (ids[i].native.path) {
                result[ids[i]._id.split('.').pop()] = this.extractValue(data, ids[i].native.path);
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
    
    parseCurrent(data) {
        const result = this.extractValues(data, this.currentIds);
        const isStart = !this.tasks.length;
        for (const attr in result) {
            if (!result.hasOwnProperty(attr)) continue;
            this.tasks.push({id: 'forecast.current.' + attr, val: result[attr]});
        }
        if (isStart) {
            this.processTasks();
        }
    }
    
    calculateAverage(sum, day) {
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
    
        const isStart = !this.tasks.length;
        for (const attr in result) {
            if (!result.hasOwnProperty(attr)) continue;
            this.tasks.push({id: 'forecast.day' + day + '.' + attr, val: result[attr], obj: this.forecastIds.find(obj => obj._id.split('.').pop() === attr), day});
        }
        if (isStart) {
            this.processTasks();
        }
    }
    
    parseForecast(data) {
        let sum = [];
        let date = null;
        let day = 0;
        
    	const isStart = !this.tasks.length;
        for (let period = 0; period < data.list.length; period++) {
            const values = this.extractValues(data.list[period], this.forecastIds);
            const curDate = new Date(values.date).getDate();
            if (date === null) {
                sum.push(values);
                date = curDate;
            } else if (date !== curDate) {
                date = curDate;
                this.calculateAverage(sum, day);
                day++;
                sum = [values];
            } else {
                sum.push(values);
            }
            
    		Object.keys(values).forEach(attr => 
                this.tasks.push({
    				id: 'forecast.period' + period + '.' + attr, 
    				val: values[attr], 
    				obj: this.forecastIds.find(obj => obj._id.split('.').pop() === attr), 
    				period
    			}));
        }
        if (sum.length) {
            this.calculateAverage(sum, day);
        }
        if (isStart) {
            this.processTasks();
        }
    }
    
    requestCurrent(query) {
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
                    this.parseCurrent(body);
                    resolve();
                } else if (error) {
                    reject('Error: ' + error);
                } else {
                    reject('Error: no data received');
                }
            });
        });
    }
    
    this.requestForecast(query) {
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
                    this.parseForecast(body);
                    resolve();
                } else if (error) {
                    reject('Error: ' + error);
                } else {
                    reject('Error: no data received');
                }
            });
        });
    }
    
    checkUnits() {
        const isStart = !this.tasks.length;
        for (let i = 0; i < this.currentIds.length; i++) {
            if (!this.currentIds[i].native.imperial) continue;
            if (this.config.imperial) {
                if (this.currentIds[i].common.unit !== this.currentIds[i].native.imperial) {
                    this.currentIds[i].common.unit = this.currentIds[i].native.imperial;
                    this.tasks.push({id: this.currentIds[i]._id, obj: this.currentIds[i]});
                }
            } else {
                if (this.currentIds[i].common.unit !== this.currentIds[i].native.metric) {
                    this.currentIds[i].common.unit = this.currentIds[i].native.metric;
                    this.tasks.push({id: this.currentIds[i]._id, obj: this.currentIds[i]});
                }
            }
        }
        isStart && this.processTasks();
    }

    end() {
        if (!this.tasks.length) {
            this.stop()
        } else {
            setTimeout(() => stop(), 2000);
        }
    }

    onUnload(callback) {
        try {


            this.log.debug('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    }
}