"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_core_1 = require("@iobroker/adapter-core");
const axios_1 = __importDefault(require("axios"));
const node_fs_1 = require("node:fs");
class Openweathermap extends adapter_core_1.Adapter {
    currentIds = [];
    forecastIds = [];
    tasks = [];
    unloaded = false;
    lastWindAngle;
    constructor(options = {}) {
        super({
            ...options,
            name: 'openweathermap',
            ready: () => this.onReady(),
            unload: (callback) => this.onUnload(callback),
        });
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(() => !this.unloaded && resolve(), ms));
    }
    async onReady() {
        try {
            const instObj = await this.getForeignObjectAsync(`system.adapter.${this.namespace}`);
            if (instObj?.common?.schedule &&
                (instObj.common.schedule === '11 * * * *' || instObj.common.schedule === '*/15 * * * *')) {
                instObj.common.schedule = `${Math.floor(Math.random() * 60)} * * * *`;
                this.log.info(`Default schedule found and adjusted to spread calls better over the full hour!`);
                await this.setForeignObjectAsync(`system.adapter.${this.namespace}`, instObj);
                this.terminate ? this.terminate() : process.exit(0);
                return;
            }
        }
        catch (err) {
            this.log.error(`Could not check or adjust the schedule: ${err.message}`);
        }
        const delay = Math.floor(Math.random() * 30000);
        this.log.debug(`Delay execution by ${delay}ms to better spread API calls`);
        await this.sleep(delay);
        this.config.language ||= 'en';
        this.config.location = (this.config.location || '').trim();
        const queryParams = {};
        if (parseInt(this.config.location, 10).toString() === this.config.location) {
            // City ID. List of city ID 'city.list.json.gz' can be downloaded here: http://bulk.openweathermap.org/sample/
            this.log.debug(`Request by "ID": ${this.config.location}`);
            queryParams.id = +this.config.location;
        }
        else if (this.config.location && this.config.location[0] >= '0' && this.config.location[0] <= '9') {
            // Geographical coordinates (latitude, longitude)
            const parts = this.config.location.split(',');
            this.log.debug(`Request by "lon/lat" - lat: ${parts[0]} / lon: ${parts[1]}`);
            queryParams.lat = parts[0];
            queryParams.lon = parts[1];
        }
        else {
            // City name, state code and country code divided by comma, Please, refer to ISO 3166 for the state codes or country codes.
            this.log.debug(`Request by "q": ${this.config.location}`);
            queryParams.q = this.config.location;
        }
        queryParams.lang = this.config.language;
        queryParams.appid = this.config.apikey;
        queryParams.units = this.config.imperial ? 'imperial' : 'metric';
        this.getStatesOf('forecast', '', async (err, states) => {
            if (err || !states) {
                return;
            }
            for (let s = 0; s < states.length; s++) {
                if (states[s] && states[s].native && states[s].native.type === 'current') {
                    this.currentIds.push(states[s]);
                }
                else if (states[s] && states[s].native && states[s].native.type === 'forecast') {
                    const m = states[s]._id.match(/\.day(\d+)\./);
                    if (m && m[1] !== '0') {
                        continue;
                    }
                    this.forecastIds.push(states[s]);
                }
            }
            await this.checkUnits();
            if (this.config.location.startsWith('file:')) {
                const json = JSON.parse((0, node_fs_1.readFileSync)(this.config.location, 'utf-8'));
                await this.parseForecast(json);
                this.end();
            }
            else {
                void this.requestCurrent(queryParams)
                    .then(() => this.requestForecast(queryParams))
                    .catch(e => this.log.error(e))
                    .then(() => {
                    this.end();
                });
            }
        });
    }
    async processTasks() {
        if (!this.unloaded) {
            if (this.tasks.length) {
                for (const task of this.tasks) {
                    if (this.unloaded) {
                        break;
                    }
                    let tempId = task.id.split('.');
                    tempId = tempId[tempId.length - 1];
                    if (task.val !== undefined) {
                        if (tempId === 'windDirection') {
                            this.lastWindAngle = task.val;
                            this.log.debug(`Wind direction value: ${this.lastWindAngle}, task.id: ${task.id}`);
                        }
                        if (task.obj) {
                            let obj = (await this.getObjectAsync(task.id));
                            if (!obj) {
                                this.log.debug(`Object ${task.id} not found, creating it`);
                                obj = JSON.parse(JSON.stringify(task.obj));
                                obj._id = task.id;
                                obj.common.role = obj.common.role.replace(/\.\d+$/, `.${task.day}`);
                                await this.setObjectAsync(task.id, obj);
                                if (tempId === 'windDirectionText') {
                                    await this.setStateAsync(task.id, this.angleToDirectionString(this.lastWindAngle), true);
                                    this.log.debug(`Wind direction value: ${this.angleToDirectionString(this.lastWindAngle)}, task.id: ${task.id}`);
                                }
                                else {
                                    await this.setStateAsync(task.id, task.val, true);
                                }
                            }
                            else {
                                if (tempId === 'windDirectionText') {
                                    await this.setStateAsync(task.id, this.angleToDirectionString(this.lastWindAngle), true);
                                    this.log.debug(`Wind direction value: ${this.angleToDirectionString(this.lastWindAngle)}, task.id: ${task.id}`);
                                }
                                else {
                                    await this.setStateAsync(task.id, task.val, true);
                                }
                            }
                        }
                        else {
                            if (tempId === 'windDirectionText') {
                                await this.setStateAsync(task.id, this.angleToDirectionString(this.lastWindAngle), true);
                                this.log.debug(`Wind direction value: ${this.angleToDirectionString(this.lastWindAngle)}, task.id: ${task.id}`);
                            }
                            else {
                                await this.setStateAsync(task.id, task.val, true);
                            }
                        }
                    }
                    else if (task.obj !== undefined) {
                        await this.setObjectAsync(task.id, task.obj);
                    }
                    else {
                        this.log.error(`Unknown task: ${JSON.stringify(task)}`);
                    }
                }
            }
        }
        this.tasks = [];
    }
    extractValue(data, path, i = 0) {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        i ||= 0;
        if (Object.prototype.hasOwnProperty.call(data, path[i])) {
            data = data[path[i]];
            if (i === path.length - 1) {
                return data;
            }
            if (typeof data === 'object') {
                return this.extractValue(data, path, i + 1);
            }
            return null;
        }
        return null;
    }
    extractValues(data, ids) {
        const result = {};
        for (let i = 0; i < ids.length; i++) {
            if (ids[i].native.path) {
                result[ids[i]._id.split('.').pop()] = this.extractValue(data, ids[i].native.path);
            }
        }
        if (result.precipitationRain === null) {
            result.precipitationRain = 0;
        }
        if (result.precipitationSnow === null) {
            result.precipitationSnow = 0;
        }
        if (result.precipitationRain === null && result.precipitationSnow === null) {
            result.precipitation = 0;
        }
        else {
            result.precipitation = (result.precipitationRain || 0) + (result.precipitationSnow || 0);
        }
        result.icon = result.icon ? `https://openweathermap.org/img/w/${result.icon}.png` : null;
        if (result.sunrise) {
            result.sunrise *= 1000;
        }
        if (result.sunset) {
            result.sunset *= 1000;
        }
        if (result.date) {
            result.date = result.date * 1000;
            result.day = (new Date(result.date).toLocaleDateString(this.config.language, { weekday: 'long' })).toString();
            result.day_short = (new Date(result.date).toLocaleDateString(this.config.language, { weekday: 'short' })).toString();
        }
        return result;
    }
    async parseCurrent(data) {
        const result = this.extractValues(data, this.currentIds);
        for (const attr in result) {
            if (!Object.prototype.hasOwnProperty.call(result, attr)) {
                continue;
            }
            this.tasks.push({ id: `forecast.current.${attr}`, val: result[attr] });
        }
        await this.processTasks();
    }
    async calculateAverage(sum, day) {
        const counts = {};
        const result = {};
        for (let i = 0; i < sum.length; i++) {
            if (new Date(sum[i].date).getHours() >= 12) {
                result.icon ||= sum[i].icon;
                result.state ||= sum[i].state;
                result.title ||= sum[i].title;
                result.date ||= sum[i].date;
                result.day ||= (new Date(sum[i].date).toLocaleDateString(this.config.language, { weekday: 'long' })).toString();
                result.day_short ||= (new Date(sum[i].date).toLocaleDateString(this.config.language, { weekday: 'short' })).toString();
                result.windDirectionText ||= sum[i].windDirectionText;
            }
            if (result.temperatureFeel === undefined || result.temperatureFeel > sum[i].temperatureFeel) {
                result.temperatureFeel = sum[i].temperatureFeel;
            }
            if (result.temperatureMin === undefined || result.temperatureMin > sum[i].temperatureMin) {
                result.temperatureMin = sum[i].temperatureMin;
            }
            if (result.temperatureMax === undefined || result.temperatureMax < sum[i].temperatureMax) {
                result.temperatureMax = sum[i].temperatureMax;
            }
            result.clouds ||= 0;
            counts.clouds ||= 0;
            if (sum[i].clouds !== null) {
                result.clouds += sum[i].clouds;
                counts.clouds++;
            }
            result.humidity ||= 0;
            counts.humidity ||= 0;
            if (sum[i].humidity !== null) {
                result.humidity += sum[i].humidity;
                counts.humidity++;
            }
            result.pressure ||= 0;
            counts.pressure ||= 0;
            if (sum[i].pressure !== null) {
                result.pressure += sum[i].pressure;
                counts.pressure++;
            }
            result.visibility ||= 0;
            counts.visibility ||= 0;
            if (sum[i].visibility !== null) {
                result.visibility += sum[i].visibility;
                counts.visibility++;
            }
            result.precipitationRain ||= 0;
            counts.precipitationRain ||= 0;
            if (sum[i].precipitationRain !== null) {
                result.precipitationRain += sum[i].precipitationRain;
                counts.precipitationRain++;
            }
            result.precipitationSnow ||= 0;
            counts.precipitationSnow ||= 0;
            if (sum[i].precipitationSnow !== null) {
                result.precipitationSnow += sum[i].precipitationSnow;
                counts.precipitationSnow++;
            }
            result.windDirection ||= 0;
            counts.windDirection ||= 0;
            if (sum[i].windDirection !== null) {
                result.windDirection += sum[i].windDirection;
                counts.windDirection++;
            }
            if (result.windSpeed === undefined || result.windSpeed < sum[i].windSpeed) {
                result.windSpeed = sum[i].windSpeed;
            }
        }
        for (const attr in counts) {
            if (!Object.prototype.hasOwnProperty.call(counts, attr)) {
                continue;
            }
            if (counts[attr]) {
                // Regen & Schnee sollen summiert bleiben, nicht gemittelt
                if (attr === 'precipitationRain' || attr === 'precipitationSnow') {
                    continue;
                }
                result[attr] = Math.round(result[attr] / counts[attr]);
            } else {
                result[attr] = null;
            }
        }
        result.icon ||= sum[sum.length - 1].icon;
        result.state ||= sum[sum.length - 1].state;
        result.title ||= sum[sum.length - 1].title;
        result.date ||= sum[sum.length - 1].date;
        result.day ||= (new Date(sum[sum.length - 1].date).toLocaleDateString(this.config.language, { weekday: 'long' })).toString();
        result.day_short ||= (new Date(sum[sum.length - 1].date).toLocaleDateString(this.config.language, { weekday: 'short' })).toString();
        if (result.precipitationRain === null && result.precipitationSnow === null) {
            result.precipitation = 0;
        }
        else {
            result.precipitation = (result.precipitationRain || 0) + (result.precipitationSnow || 0);
        }
        this.log.debug(`Process forecast for day ${day}`);
        for (const attr in result) {
            if (!Object.prototype.hasOwnProperty.call(result, attr)) {
                continue;
            }
            this.tasks.push({
                id: `forecast.day${day}.${attr}`,
                val: result[attr],
                obj: this.forecastIds.find(obj => obj._id.split('.').pop() === attr),
                day,
            });
        }
        await this.processTasks();
    }
    async parseForecast(data) {
        let sum = [];
        let date = null;
        let day = 0;
        for (let period = 0; period < data.list.length; period++) {
            const values = this.extractValues(data.list[period], this.forecastIds);
            const curDate = new Date(values.date).getDate();
            if (date === null) {
                sum.push(values);
                date = curDate;
            }
            else if (date !== curDate) {
                date = curDate;
                await this.calculateAverage(sum, day);
                day++;
                sum = [values];
            }
            else {
                sum.push(values);
            }
            Object.keys(values).forEach(attr => this.tasks.push({
                id: `forecast.period${period}.${attr}`,
                val: values[attr],
                obj: this.forecastIds.find(obj => obj._id.split('.').pop() === attr),
                period,
            }));
        }
        if (sum.length) {
            await this.calculateAverage(sum, day);
        }
        await this.processTasks();
    }
    requestCurrent(queryParams) {
        return new Promise((resolve, reject) => {
            (0, axios_1.default)({
                method: 'get',
                baseURL: 'https://api.openweathermap.org/data/2.5/weather',
                params: queryParams,
                timeout: 10000,
                responseType: 'json',
                validateStatus: status => status === 200,
            })
                .then(async (response) => {
                // this.log.debug(`Received current response: ${JSON.stringify(response.data)}`);
                await this.parseCurrent(response.data);
                resolve();
            })
                .catch(error => {
                if (error.response) {
                    reject(new Error(`Error: ${error.response.status}`));
                }
                else if (error.request) {
                    reject(new Error(`Error: no data received for Current Weather data`));
                }
                else {
                    reject(new Error(`Error: ${error.message}`));
                }
                console.log(error.config);
            });
        });
    }
    requestForecast(queryParams) {
        return new Promise((resolve, reject) => {
            (0, axios_1.default)({
                method: 'get',
                baseURL: 'https://api.openweathermap.org/data/2.5/forecast',
                params: queryParams,
                timeout: 10000,
                responseType: 'json',
                validateStatus: status => status === 200,
            })
                .then(async (response) => {
                // this.log.debug(`Received forecast response: ${JSON.stringify(response.data)}`);
                await this.parseForecast(response.data);
                resolve();
            })
                .catch(error => {
                if (error.response) {
                    reject(new Error(`Error: ${error.response.status}`));
                }
                else if (error.request) {
                    reject(new Error(`Error: no data received for Forecast`));
                }
                else {
                    reject(new Error(`Error: ${error.message}`));
                }
                console.log(error.config);
            });
        });
    }
    async checkUnits() {
        for (let i = 0; i < this.currentIds.length; i++) {
            if (!this.currentIds[i].native.imperial) {
                continue;
            }
            if (this.config.imperial) {
                if (this.currentIds[i].common.unit !== this.currentIds[i].native.imperial) {
                    this.currentIds[i].common.unit = this.currentIds[i].native.imperial;
                    this.tasks.push({ id: this.currentIds[i]._id, obj: this.currentIds[i] });
                }
            }
            else {
                if (this.currentIds[i].common.unit !== this.currentIds[i].native.metric) {
                    this.currentIds[i].common.unit = this.currentIds[i].native.metric;
                    this.tasks.push({ id: this.currentIds[i]._id, obj: this.currentIds[i] });
                }
            }
        }
        await this.processTasks();
    }
    angleToDirectionString(grade) {
        grade = parseFloat(grade);
        if (isNaN(grade) || grade < 0.0 || grade > 360.0) {
            return '--';
        }
        // Todo translate to the configured language
        let directions = [
            'N',
            'NNE',
            'NE',
            'ENE',
            'E',
            'ESE',
            'SE',
            'SSE',
            'S',
            'SSW',
            'SW',
            'WSW',
            'W',
            'WNW',
            'NW',
            'NNW',
        ];
        if (this.config.language === 'de') {
            directions = [
                'N',
                'NNO',
                'NO',
                'ONO',
                'O',
                'OSO',
                'SO',
                'SSO',
                'S',
                'SSW',
                'SW',
                'WSW',
                'W',
                'WNW',
                'NW',
                'NNW',
            ];
        }
        if (this.config.language === 'ru') {
            directions = [
                'С',
                'ССВ',
                'СВ',
                'ВСВ',
                'В',
                'ВЮВ',
                'ЮВ',
                'ЮЮВ',
                'Ю',
                'ЮЮЗ',
                'ЮЗ',
                'ЗЮЗ',
                'З',
                'ЗСЗ',
                'СЗ',
                'ССЗ',
            ];
        }
        if (this.config.language === 'pt') {
            directions = [
                'N',
                'NNE',
                'NE',
                'ENE',
                'E',
                'ESE',
                'SE',
                'SSE',
                'S',
                'SSO',
                'SO',
                'OSO',
                'O',
                'ONO',
                'NO',
                'NNO',
            ];
        }
        if (this.config.language === 'nl') {
            directions = [
                'N',
                'NNO',
                'NO',
                'ONO',
                'O',
                'OSO',
                'ZO',
                'ZSO',
                'Z',
                'ZZW',
                'ZW',
                'WZW',
                'W',
                'WNW',
                'NW',
                'NNW',
            ];
        }
        if (this.config.language === 'fr') {
            directions = [
                'N',
                'NNE',
                'NE',
                'ENE',
                'E',
                'ESE',
                'SE',
                'SSE',
                'S',
                'SSO',
                'SO',
                'OSO',
                'O',
                'ONO',
                'NO',
                'NNO',
            ];
        }
        if (this.config.language === 'it') {
            directions = [
                'N',
                'NNE',
                'NE',
                'ENE',
                'E',
                'ESE',
                'SE',
                'SSE',
                'S',
                'SSO',
                'SO',
                'OSO',
                'O',
                'ONO',
                'NO',
                'NNO',
            ];
        }
        if (this.config.language === 'es') {
            directions = [
                'N',
                'NNE',
                'NE',
                'ENE',
                'E',
                'ESE',
                'SE',
                'SSE',
                'S',
                'SSO',
                'SO',
                'OSO',
                'O',
                'ONO',
                'NO',
                'NNO',
            ];
        }
        if (this.config.language === 'pl') {
            directions = [
                'N',
                'NNE',
                'NE',
                'ENE',
                'E',
                'ESE',
                'SE',
                'SSE',
                'S',
                'SSW',
                'SW',
                'WSW',
                'W',
                'WNW',
                'NW',
                'NNW',
            ];
        }
        const index = Math.round((grade % 360) / 22.5) % 16;
        return directions[index];
    }
    end() {
        if (this.unloaded) {
            return;
        }
        if (this.stop) {
            this.stop?.().catch(error => this.log.error(error));
        }
    }
    onUnload(callback) {
        this.unloaded = true;
        try {
            this.log.debug('cleaned everything up...');
            callback();
        }
        catch {
            callback();
        }
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Openweathermap(options);
}
else {
    // otherwise start the instance directly
    (() => new Openweathermap())();
}
//# sourceMappingURL=main.js.map
