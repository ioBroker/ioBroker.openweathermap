/** Tag of the custom element; a host checks that the module defines exactly this one */
export const TAG = 'iob-openweathermap-weather';

/** The built module, next to its manifest */
export const MODULE_FILE = 'openweathermap-weather.js';

/** The manifest the build writes next to the module; `common.webComponents` names this one */
export const MANIFEST_FILE = 'openweathermap-weather.json';

/** Where `tasks.ts` puts the module in the admin folder; the React import is relative to it */
export const MODULE_PATH = `webcomponents/${MODULE_FILE}`;

/** At most this many forecast days, like the vis-2 widget: `forecast.day0` (today) to `forecast.day5` */
export const MAX_DAYS = 6;

/** The states of `openweathermap.<n>.forecast.current` the element reads */
export const CURRENT_STATES = [
    'temperature',
    'humidity',
    'title',
    'state',
    'icon',
    'temperatureMin',
    'temperatureMax',
    'pressure',
    'windDirection',
    'windSpeed',
    'precipitation',
] as const;

/** The states of `openweathermap.<n>.forecast.day<k>` the element reads */
export const DAY_STATES = [
    'date',
    'temperatureMin',
    'temperatureMax',
    'title',
    'icon',
    'humidity',
    'windDirection',
    'windSpeed',
    'precipitation',
] as const;

export type CurrentState = (typeof CURRENT_STATES)[number];
export type DayState = (typeof DAY_STATES)[number];

/** The values of the settings of the manifest; a setting without a value is missing */
export type WeatherSettings = {
    /** Instance of the adapter: `openweathermap.0` (JSON-Config), also `0` or `system.adapter.openweathermap.0` */
    instance?: string;
    /** Shown above the weather */
    title?: string;
    /** `all` - current weather and forecast, `current` - only the current weather, `days` - only the forecast */
    type?: string;
    /** How many forecast days, `1` to `6` */
    days?: string;
    /** A real sensor whose temperature is shown instead of the one of OpenWeatherMap */
    currentTempOid?: string;
    /** A real sensor whose humidity is shown instead of the one of OpenWeatherMap */
    currentHumidityOid?: string;
};

/**
 * The number of the adapter instance a setting names
 *
 * @param instance `openweathermap.0`, `system.adapter.openweathermap.0` or `0`
 * @returns `0`, or null if the setting names no instance of openweathermap
 */
export function getInstance(instance: string | number | undefined): number | null {
    const text = instance === undefined || instance === null ? '' : String(instance).trim();
    const match = text.match(/^(?:(?:system\.adapter\.)?openweathermap\.)?(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

/**
 * How many forecast days the settings ask for. Like the vis-2 widget, the element reads them for `current` too: the
 * tile hides them, the details show them.
 *
 * @param settings the settings of the element
 * @returns 1 to 6, 6 if not set
 */
export function getDaysCount(settings: WeatherSettings): number {
    const days = parseInt(settings.days || '', 10);
    return days >= 1 ? Math.min(MAX_DAYS, days) : MAX_DAYS;
}

/** The 16 directions of the compass, as `Utils.getWindDirection()` of the vis-2 widget names them */
const DIRECTIONS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

/**
 * The direction of the compass an angle points to
 *
 * @param angle the angle in degrees, 0 is north
 * @returns e.g. `NNE`
 */
export function getWindDirection(angle: number): string {
    const normalized = ((angle % 360) + 360) % 360;
    return DIRECTIONS[Math.floor((normalized + 11.25) / 22.5) % 16];
}

/**
 * A value of a state as a number
 *
 * @param val the value of the state
 * @returns the number, or null if there is none
 */
export function toNumber(val: ioBroker.StateValue | undefined): number | null {
    if (val === null || val === undefined || val === '' || typeof val === 'boolean') {
        return null;
    }
    const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
    return Number.isFinite(num) ? num : null;
}
