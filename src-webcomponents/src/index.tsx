/**
 * The weather of OpenWeatherMap as a web component: `<iob-openweathermap-weather>`.
 *
 * One module for every host - vis-2, devices, Aura, admin (`@iobroker/web-components`). Its manifest is a file of
 * its own (`openweathermap-weather.json`, written by the build from `manifest.ts`), so a host loads this module only
 * when it shows the element. The host sets `socket` and `settings`, and if it has them `theme`, `editMode` and
 * `dialogs`.
 *
 * The element reads the same states as the vis-2 widget "Weather": `openweathermap.<n>.forecast.current.*` and
 * `forecast.day<k>.*`, and optionally a real sensor for the temperature and the humidity. The units are those of
 * the objects of the current weather, which the adapter switches between metric and imperial. It writes nothing.
 * A click shows the details in a dialog of the host, after the event `openweathermap-weather-click` - a host that
 * answers it itself calls `preventDefault()`.
 *
 * React is not in the module: it comes from `lib/esm/react-19.js` beside `adapter/`, see `vite.config.ts`.
 */
import type { JSX } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { defineWebComponent, getThemeCssVariables, IobWebComponent } from '@iobroker/web-components/element';

import {
    CURRENT_STATES,
    DAY_STATES,
    getDaysCount,
    getInstance,
    getWindDirection,
    TAG,
    toNumber,
    type CurrentState,
    type DayState,
    type WeatherSettings,
} from './constants';
import { getVisWord, getWord, type WordKey } from './i18n';
import { getIconUrl } from './icons';
import { DETAILS_STYLES, STYLES } from './styles';
import { Hint, WeatherDetails, WeatherView, type DayValues, type Fact, type WeatherValues } from './WeatherView';

/** The event a click on the tile sends to the host before the element shows the details */
const CLICK_EVENT = 'openweathermap-weather-click';

/** The object with the decimal separator of the system */
const SYSTEM_CONFIG = 'system.config';

/** The keys of the weekdays in the words of the vis-2 widget, as `Date.getDay()` counts them */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * The folder of the states of the instance a setting names
 *
 * @param settings the settings of the element
 * @returns e.g. `openweathermap.0.forecast`, or null without an instance
 */
function getForecastFolder(settings: WeatherSettings): string | null {
    const instance = getInstance(settings.instance);
    return instance === null ? null : `openweathermap.${instance}.forecast`;
}

/**
 * A number as the system writes it
 *
 * @param num the number
 * @param decimals how many decimals at most
 * @param comma whether the decimal separator is a comma
 */
function formatNumber(num: number, decimals: number, comma: boolean): string {
    const factor = 10 ** decimals;
    const text = String(Math.round(num * factor) / factor);
    return comma ? text.replace('.', ',') : text;
}

/**
 * A date in the language of the system
 *
 * @param date the date
 * @param lang the language of the system
 * @param options what of the date to show
 */
function formatDate(date: Date, lang: string, options: Intl.DateTimeFormatOptions): string {
    try {
        return date.toLocaleDateString(lang === 'zh-cn' ? 'zh-CN' : lang, options);
    } catch {
        return date.toLocaleDateString(undefined, options);
    }
}

class OpenWeatherMapWeather extends IobWebComponent<WeatherSettings> {
    readonly #root: Root;

    /** Draws the open dialog again with the current values; null while none is open */
    #drawDetails: (() => void) | null = null;

    constructor() {
        super();
        const shadow = this.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = STYLES;
        const mount = document.createElement('div');
        mount.className = 'mount';
        shadow.append(style, mount);
        this.#root = createRoot(mount);
    }

    protected override getStateIds(settings: WeatherSettings): string[] {
        const folder = getForecastFolder(settings);
        if (!folder) {
            return [];
        }
        const ids = CURRENT_STATES.map(name => `${folder}.current.${name}`);
        const count = getDaysCount(settings);
        for (let day = 0; day < count; day++) {
            ids.push(...DAY_STATES.map(name => `${folder}.day${day}.${name}`));
        }
        // a real sensor instead of the temperature and the humidity of OpenWeatherMap
        if (settings.type !== 'days') {
            for (const id of [settings.currentTempOid, settings.currentHumidityOid]) {
                if (id) {
                    ids.push(id);
                }
            }
        }
        return ids;
    }

    protected override getObjectIds(settings: WeatherSettings): string[] {
        // the decimal separator of the system, as the vis-2 widget takes it
        return getForecastFolder(settings) ? [SYSTEM_CONFIG] : [];
    }

    #word = (key: WordKey): string => getWord(this.systemLang, key);

    protected override render(): void {
        this.#root.render(this.#view());
        // an open dialog follows the states too
        this.#drawDetails?.();
    }

    /** What the element shows for the current settings and states */
    #view(): JSX.Element {
        const settings = this.settings;
        const folder = getForecastFolder(settings);

        if (!folder) {
            return <Hint text={this.#word('chooseInstance')} />;
        }
        // The objects of the states are read once: `null` - the instance has no such state (another adapter,
        // an instance that was deleted)
        if (this.objects[`${folder}.current.temperature`] === null) {
            return <Hint text={this.#word('noData')} />;
        }

        return (
            <WeatherView
                values={this.#values(folder)}
                type={settings.type || 'all'}
                title={settings.title || ''}
                editMode={this.editMode}
                detailsLabel={this.#word('details')}
                onDetails={() => void this.#openDetails()}
            />
        );
    }

    /**
     * The weather of the instance as text ready to show
     *
     * @param folder `openweathermap.<n>.forecast`
     */
    #values(folder: string): WeatherValues {
        const settings = this.settings;
        const lang = this.systemLang;
        const config = this.objects[SYSTEM_CONFIG] as ioBroker.SystemConfigObject | null | undefined;
        const comma = !!config?.common?.isFloatComma;
        const vis = (key: string): string => getVisWord(lang, key);

        const num = (id: string | undefined): number | null => (id ? toNumber(this.states[id]?.val) : null);
        const text = (id: string): string => {
            const val = this.states[id]?.val;
            return val === null || val === undefined ? '' : String(val);
        };
        // the adapter switches the units of the objects of the current weather between metric and imperial
        const unit = (name: CurrentState, fallback: string): string =>
            (this.objects[`${folder}.current.${name}`]?.common as ioBroker.StateCommon | undefined)?.unit || fallback;
        const tempUnit = unit('temperature', '°C');
        const windUnit = unit('windSpeed', 'm/s');
        const pressureUnit = unit('pressure', 'hPa');
        const precipitationUnit = unit('precipitation', 'mm');
        const temp = (value: number | null): string =>
            value === null ? '' : `${formatNumber(value, 0, comma)}${tempUnit}`;

        /** Wind, humidity, pressure and precipitation of a folder, those with a value */
        const facts = (base: string, withPressure: boolean): Fact[] => {
            const list: Fact[] = [];
            const direction = num(`${base}.windDirection`);
            const speed = num(`${base}.windSpeed`);
            if (direction !== null || speed !== null) {
                list.push({
                    label: vis('Wind'),
                    value: [
                        direction === null ? '' : vis(`wind_${getWindDirection(direction)}`),
                        speed === null ? '' : `${formatNumber(speed, 0, comma)} ${windUnit}`,
                    ]
                        .filter(Boolean)
                        .join(' '),
                });
            }
            const humidity = num(`${base}.humidity`);
            if (humidity !== null) {
                list.push({ label: vis('Humidity'), value: `${formatNumber(humidity, 0, comma)}%` });
            }
            const pressure = withPressure ? num(`${base}.pressure`) : null;
            if (pressure !== null) {
                list.push({ label: vis('Pressure'), value: `${formatNumber(pressure, 0, comma)} ${pressureUnit}` });
            }
            const precipitation = num(`${base}.precipitation`);
            if (precipitation !== null) {
                list.push({
                    label: vis('Precip.'),
                    value: `${formatNumber(precipitation, 1, comma)} ${precipitationUnit}`,
                });
            }
            return list;
        };

        const current = (name: CurrentState): number | null => num(`${folder}.current.${name}`);
        const sensorTemp = settings.type === 'days' ? null : num(settings.currentTempOid);
        const sensorHumidity = settings.type === 'days' ? null : num(settings.currentHumidityOid);
        const forecastTemp = current('temperature');
        const humidity = sensorHumidity ?? current('humidity');
        const title = text(`${folder}.current.title`);

        const days: DayValues[] = [];
        const count = getDaysCount(settings);
        for (let day = 0; day < count; day++) {
            const base = `${folder}.day${day}`;
            // the adapter makes as many days as OpenWeatherMap delivers - usually 5 or 6
            if (this.objects[`${base}.temperatureMax`] === null) {
                continue;
            }
            const value = (name: DayState): number | null => num(`${base}.${name}`);
            const ts = value('date');
            const date = ts ? new Date(ts) : new Date(Date.now() + day * 24 * 3600 * 1000);
            const max = value('temperatureMax');
            const min = value('temperatureMin');
            const dayTitle = text(`${base}.title`);
            days.push({
                weekday: vis(WEEKDAYS[date.getDay()]),
                date: formatDate(date, lang, { day: 'numeric', month: 'numeric' }),
                icon: getIconUrl(this.states[`${base}.icon`]?.val),
                titleText: dayTitle ? vis(dayTitle) : '',
                max: max === null ? '--' : temp(max),
                min: min === null ? '--' : temp(min),
                facts: facts(base, false),
            });
        }

        return {
            current: {
                date: formatDate(new Date(), lang, { weekday: 'long', day: 'numeric', month: 'long' }),
                icon: getIconUrl(this.states[`${folder}.current.icon`]?.val),
                titleText: title ? vis(title) : '',
                description: text(`${folder}.current.state`),
                // the sensor with one decimal, the forecast rounded - as the vis-2 widget shows them
                temperature:
                    sensorTemp !== null
                        ? `${formatNumber(sensorTemp, 1, comma)}${tempUnit}`
                        : forecastTemp !== null
                          ? temp(forecastTemp)
                          : '--',
                humidity: humidity === null ? '--%' : `${formatNumber(humidity, 0, comma)}%`,
                max: temp(current('temperatureMax')),
                min: temp(current('temperatureMin')),
                facts: facts(`${folder}.current`, true),
            },
            days,
        };
    }

    /** Shows the details in a dialog of the host - unless the host answers the click itself */
    async #openDetails(): Promise<void> {
        const settings = this.settings;
        const folder = getForecastFolder(settings);
        if (
            this.editMode ||
            this.#drawDetails ||
            !folder ||
            !this.emit(CLICK_EVENT, { instance: `openweathermap.${getInstance(settings.instance)}` })
        ) {
            return;
        }

        // The host moves the element into its own dialog: it brings its styles and the theme of the host along
        const element = document.createElement('div');
        for (const [name, value] of Object.entries(getThemeCssVariables(this.theme))) {
            element.style.setProperty(name, value);
        }
        const shadow = element.attachShadow({ mode: 'open' });
        const style = document.createElement('style');
        style.textContent = DETAILS_STYLES;
        const mount = document.createElement('div');
        shadow.append(style, mount);
        const root = createRoot(mount);

        // drawn again with every drawing of the element, so the dialog follows the states while it is open
        const draw = (): void => {
            const current = getForecastFolder(this.settings);
            if (current) {
                root.render(<WeatherDetails values={this.#values(current)} />);
            }
        };
        this.#drawDetails = draw;
        draw();

        try {
            await this.openDialog({
                title: settings.title || getVisWord(this.systemLang, 'Weather'),
                element,
                width: 640,
            });
        } finally {
            this.#drawDetails = null;
            root.unmount();
        }
    }
}

defineWebComponent(TAG, OpenWeatherMapWeather);
