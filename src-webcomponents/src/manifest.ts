/**
 * The manifest of `<iob-openweathermap-weather>`. Read by the build only (`vite.config.ts`), which writes it as
 * `openweathermap-weather.json` next to the module - a host reads that file for its palette and its settings
 * without loading the module.
 *
 * The name and the labels are the words of the vis-2 widget "Weather" (`src-widgets/src/i18n/`), read by the
 * build. The same name, per language, makes vis-2 offer its native widget instead of this component; Aura, admin
 * and devices show the component. Only the description is new and lives here.
 */
import type { WebComponentManifest, WebComponentText } from '@iobroker/web-components';

// with the extension: `vite.config.ts` imports this file, and Vite may load its config natively
import { MAX_DAYS, MODULE_FILE, TAG } from './constants.ts';

export { MANIFEST_FILE, MODULE_FILE, MODULE_PATH, TAG } from './constants.ts';

const DESCRIPTION: WebComponentText = {
    en: 'Current weather and the forecast for up to six days from OpenWeatherMap',
    de: 'Aktuelles Wetter und die Vorhersage für bis zu sechs Tage von OpenWeatherMap',
    ru: 'Текущая погода и прогноз до шести дней от OpenWeatherMap',
    pt: 'Tempo atual e a previsão para até seis dias do OpenWeatherMap',
    nl: 'Actueel weer en de voorspelling voor maximaal zes dagen van OpenWeatherMap',
    fr: "Météo actuelle et prévisions jusqu'à six jours d'OpenWeatherMap",
    it: 'Meteo attuale e previsioni fino a sei giorni da OpenWeatherMap',
    es: 'El tiempo actual y la previsión de hasta seis días de OpenWeatherMap',
    pl: 'Aktualna pogoda i prognoza na maksymalnie sześć dni z OpenWeatherMap',
    uk: 'Поточна погода та прогноз до шести днів від OpenWeatherMap',
    'zh-cn': '来自 OpenWeatherMap 的当前天气和最多六天的天气预报',
};

/**
 * The manifest with the words of the vis-2 widget
 *
 * @param vis a word of the vis-2 widget (`src-widgets/src/i18n/`, without the prefix `openweathermap_`) in every
 *   language
 */
export function buildManifest(vis: (key: string) => WebComponentText): WebComponentManifest {
    return {
        $schema: 'https://raw.githubusercontent.com/ioBroker/web-components/main/schemas/manifest.json',
        manifestVersion: 1,
        tag: TAG,
        // the label of the vis-2 widget, as its palette shows it
        name: vis('weather'),
        description: DESCRIPTION,
        // relative to this file: /adapter/openweathermap/openweathermap.png
        icon: '../openweathermap.png',
        module: MODULE_FILE,
        // a dashboard tile with the current weather above six days
        size: { width: 380, height: 220 },
        settings: {
            type: 'panel',
            items: {
                instance: {
                    type: 'instance',
                    adapter: 'openweathermap',
                    default: 'openweathermap.0',
                    label: vis('instance'),
                },
                title: {
                    type: 'text',
                    label: vis('title'),
                },
                type: {
                    type: 'select',
                    default: 'all',
                    label: vis('type'),
                    options: [
                        { value: 'all', label: vis('type_all') },
                        { value: 'current', label: vis('type_current') },
                        { value: 'days', label: vis('type_days') },
                    ],
                },
                days: {
                    type: 'select',
                    default: String(MAX_DAYS),
                    label: vis('days'),
                    hidden: 'data.type === "current"',
                    options: Array.from({ length: MAX_DAYS }, (_, i) => String(MAX_DAYS - i)).map(value => ({
                        value,
                        label: value,
                    })),
                },
                currentTempOid: {
                    type: 'objectId',
                    types: 'state',
                    label: vis('current_temp_oid'),
                    help: vis('current_temp_oid_tooltip'),
                    hidden: 'data.type === "days"',
                },
                currentHumidityOid: {
                    type: 'objectId',
                    types: 'state',
                    label: vis('current_humidity_oid'),
                    help: vis('current_temp_oid_tooltip'),
                    hidden: 'data.type === "days"',
                },
            },
        },
    };
}
