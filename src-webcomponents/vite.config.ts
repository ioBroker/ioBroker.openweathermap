import react from '@vitejs/plugin-react';
import { checkManifest, getReactImportPath, REACT_SPECIFIERS, type WebComponentText } from '@iobroker/web-components';
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

// with the extension: Vite may load its config natively, without a bundler that would add it
import { VIS_WORDS } from './src/i18n.ts';
import { buildManifest, MANIFEST_FILE, MODULE_FILE, MODULE_PATH } from './src/manifest.ts';

/**
 * The web component `<iob-openweathermap-weather>`: one ES module, `admin/webcomponents/openweathermap-weather.js`,
 * and its manifest `openweathermap-weather.json` next to it (`common.webComponents`). Every host - vis-2, devices,
 * Aura, admin - reads them from `/adapter/openweathermap/webcomponents/`. No module federation: the host shares
 * nothing but the socket.
 *
 * React is not bundled: the four React imports point at `lib/esm/react-19.js`, which web and admin serve
 * beside `adapter/`. The path is relative to the module, so a path prefix of a reverse proxy stays.
 */

const LANGUAGES: ioBroker.Languages[] = ['en', 'de', 'ru', 'pt', 'nl', 'fr', 'it', 'es', 'pl', 'uk', 'zh-cn'];

/** The dictionary of the vis-2 widget "Weather", without the prefix `openweathermap_` */
const VIS_I18N = '../src-widgets/src/i18n';

function readJson<T>(path: string): T {
    return JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')) as T;
}

const visWords = Object.fromEntries(
    LANGUAGES.map(lang => [lang, readJson<Record<string, string>>(`${VIS_I18N}/${lang}.json`)]),
) as Record<ioBroker.Languages, Record<string, string>>;

/**
 * A word of the vis-2 widget in every language
 *
 * @param key the key in `src-widgets/src/i18n/<lang>.json`
 */
function visWord(key: string): WebComponentText {
    const text: Partial<Record<ioBroker.Languages, string>> = {};
    for (const lang of LANGUAGES) {
        if (!visWords[lang][key]) {
            throw new Error(`${VIS_I18N}/${lang}.json has no "${key}"`);
        }
        text[lang] = visWords[lang][key];
    }
    return text as WebComponentText;
}

/** The words the element shows (`VIS_WORDS`), by language - a few kB instead of the whole dictionary */
function pickWords(): Record<string, Record<string, string>> {
    const picked: Record<string, Record<string, string>> = {};
    for (const lang of LANGUAGES) {
        picked[lang] = {};
        for (const key of VIS_WORDS) {
            if (visWords[lang][key]) {
                picked[lang][key] = visWords[lang][key];
            } else if (lang === 'en') {
                throw new Error(`${VIS_I18N}/en.json has no "${key}"`);
            }
        }
    }
    return picked;
}

/** Writes `openweathermap-weather.json` next to the module, checked like a host checks it */
function manifestFile(): Plugin {
    return {
        name: 'openweathermap-web-component-manifest',
        generateBundle() {
            let manifest;
            try {
                manifest = buildManifest(visWord);
            } catch (e) {
                this.error(`${MANIFEST_FILE}: ${(e as Error).message}`);
            }
            const problem = checkManifest(manifest);
            if (problem) {
                this.error(`${MANIFEST_FILE}: ${problem}`);
            }
            this.emitFile({
                type: 'asset',
                fileName: MANIFEST_FILE,
                source: `${JSON.stringify(manifest, null, 4)}\n`,
            });
        },
    };
}

const reactImport = getReactImportPath(MODULE_PATH);

export default {
    plugins: [react(), manifestFile()],
    define: {
        __OWM_WORDS__: JSON.stringify(pickWords()),
        'process.env.NODE_ENV': JSON.stringify('production'),
    },
    build: {
        target: 'es2022',
        outDir: './build',
        emptyOutDir: true,
        lib: {
            entry: './src/index.tsx',
            formats: ['es'],
            fileName: (): string => MODULE_FILE,
        },
        rollupOptions: {
            external: [...REACT_SPECIFIERS],
            output: {
                paths: Object.fromEntries(REACT_SPECIFIERS.map(specifier => [specifier, reactImport])),
                // one file: a host imports exactly one URL
                codeSplitting: false,
                // library mode keeps whitespace for the bundler of a consumer; this module is loaded as it is
                minify: true,
            },
        },
    },
};
