/**
 * The weather icons of the vis-2 widget (`src-widgets/src/react-weather/iconsWeather/`), compiled into the module
 * as their text - the module is the only file a host loads, so it brings its images along.
 */
import brokenClouds from '../../src-widgets/src/react-weather/iconsWeather/brokenClouds.svg?raw';
import clearSky from '../../src-widgets/src/react-weather/iconsWeather/clearSky.svg?raw';
import fewClouds from '../../src-widgets/src/react-weather/iconsWeather/fewClouds.svg?raw';
import mist from '../../src-widgets/src/react-weather/iconsWeather/mist.svg?raw';
import rain from '../../src-widgets/src/react-weather/iconsWeather/rain.svg?raw';
import scatteredClouds from '../../src-widgets/src/react-weather/iconsWeather/scatteredClouds.svg?raw';
import showerRain from '../../src-widgets/src/react-weather/iconsWeather/showerRain.svg?raw';
import snow from '../../src-widgets/src/react-weather/iconsWeather/snow.svg?raw';
import thunderstorm from '../../src-widgets/src/react-weather/iconsWeather/thunderstorm.svg?raw';

/** The icon per code of OpenWeatherMap, the same for day (`d`) and night (`n`), as `getIcon()` of the widget */
const ICONS = new Map<string, string>([
    ['01', clearSky],
    ['02', fewClouds],
    ['03', scatteredClouds],
    ['04', brokenClouds],
    ['09', showerRain],
    ['10', rain],
    ['11', thunderstorm],
    ['13', snow],
    ['50', mist],
]);

const urls: Record<string, string> = {};

/**
 * The image of a weather icon
 *
 * @param icon the value of `forecast.*.icon`: `https://openweathermap.org/img/w/10d.png`, or the code `10d`
 * @returns a `data:` URL of the icon of the widget; the address of OpenWeatherMap for a code the widget has no icon
 *   for; null without an icon
 */
export function getIconUrl(icon: ioBroker.StateValue | undefined): string | null {
    if (icon === null || icon === undefined || icon === '') {
        return null;
    }
    const text = String(icon);
    let name = text.split('/').pop()?.split('.')[0] || '';
    try {
        name = decodeURI(name);
    } catch {
        // keep it as it is
    }
    const code = name.match(/^(\d\d)[dn]$/)?.[1];
    const svg = code ? ICONS.get(code) : undefined;
    if (code && svg) {
        urls[code] ||= `data:image/svg+xml,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;
        return urls[code];
    }
    return /^https?:\/\//.test(text) ? text : null;
}
