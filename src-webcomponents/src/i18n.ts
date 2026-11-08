/**
 * The words the element shows, in the languages of ioBroker.
 *
 * Most of them are the words of the vis-2 widget (`src-widgets/src/i18n/`, without the prefix `openweathermap_`):
 * the build picks the few the element needs into `__OWM_WORDS__` (see `vite.config.ts`). Only the words the vis-2
 * widget does not have live here.
 */

/** The words of `VIS_WORDS` by language, put in by the build */
declare const __OWM_WORDS__: Record<string, Record<string, string>>;

/** The words of the vis-2 widget the element shows; `vite.config.ts` picks exactly these */
export const VIS_WORDS = [
    // the forecast days
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    // the details
    'Weather',
    'Wind',
    'Humidity',
    'Pressure',
    'Precip.',
    // `forecast.*.title`, the group of the weather of OpenWeatherMap
    'Clear',
    'Clouds',
    'Thunderstorm',
    'Drizzle',
    'Rain',
    'Snow',
    'Mist',
    'Smoke',
    'Haze',
    'Dust',
    'Fog',
    'Sand',
    'Ash',
    'Squall',
    'Tornado',
    // the directions of the wind
    'wind_N',
    'wind_NNE',
    'wind_NE',
    'wind_ENE',
    'wind_E',
    'wind_ESE',
    'wind_SE',
    'wind_SSE',
    'wind_S',
    'wind_SSW',
    'wind_SW',
    'wind_WSW',
    'wind_W',
    'wind_WNW',
    'wind_NW',
    'wind_NNW',
];

const EN = {
    chooseInstance: 'Choose an instance of OpenWeatherMap in the settings',
    noData: 'This instance has no weather data yet',
    details: 'Details',
};

export type WordKey = keyof typeof EN;

const WORDS: Record<string, Record<WordKey, string>> = {
    en: EN,
    de: {
        chooseInstance: 'Instanz von OpenWeatherMap in den Einstellungen wählen',
        noData: 'Diese Instanz hat noch keine Wetterdaten',
        details: 'Details',
    },
    ru: {
        chooseInstance: 'Выберите экземпляр OpenWeatherMap в настройках',
        noData: 'У этого экземпляра пока нет данных о погоде',
        details: 'Подробности',
    },
    pt: {
        chooseInstance: 'Escolha uma instância do OpenWeatherMap nas configurações',
        noData: 'Esta instância ainda não tem dados meteorológicos',
        details: 'Detalhes',
    },
    nl: {
        chooseInstance: 'Kies een instantie van OpenWeatherMap in de instellingen',
        noData: 'Deze instantie heeft nog geen weergegevens',
        details: 'Details',
    },
    fr: {
        chooseInstance: 'Choisissez une instance de OpenWeatherMap dans les paramètres',
        noData: "Cette instance n'a pas encore de données météo",
        details: 'Détails',
    },
    it: {
        chooseInstance: "Scegli un'istanza di OpenWeatherMap nelle impostazioni",
        noData: 'Questa istanza non ha ancora dati meteo',
        details: 'Dettagli',
    },
    es: {
        chooseInstance: 'Elija una instancia de OpenWeatherMap en la configuración',
        noData: 'Esta instancia aún no tiene datos meteorológicos',
        details: 'Detalles',
    },
    pl: {
        chooseInstance: 'Wybierz instancję OpenWeatherMap w ustawieniach',
        noData: 'Ta instancja nie ma jeszcze danych pogodowych',
        details: 'Szczegóły',
    },
    uk: {
        chooseInstance: 'Виберіть екземпляр OpenWeatherMap у налаштуваннях',
        noData: 'Цей екземпляр ще не має даних про погоду',
        details: 'Подробиці',
    },
    'zh-cn': {
        chooseInstance: '请在设置中选择 OpenWeatherMap 实例',
        noData: '此实例尚无天气数据',
        details: '详细信息',
    },
};

/**
 * A word of the element in the language of the system, English if there is none in it
 *
 * @param lang the language of the ioBroker system
 * @param key the word
 */
export function getWord(lang: string, key: WordKey): string {
    return WORDS[lang]?.[key] || EN[key];
}

/**
 * A word of the vis-2 widget in the language of the system: English if there is none in it, the key itself if
 * there is none at all - like an unknown `title` of OpenWeatherMap
 *
 * @param lang the language of the ioBroker system
 * @param key the key in `src-widgets/src/i18n/<lang>.json`
 */
export function getVisWord(lang: string, key: string): string {
    return __OWM_WORDS__[lang]?.[key] || __OWM_WORDS__.en?.[key] || key;
}
