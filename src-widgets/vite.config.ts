import { readFileSync } from 'node:fs';
import { defineVisWidgetConfig } from '@iobroker/types-vis-2/defineVisWidgetConfig';

const pack = JSON.parse(readFileSync('./package.json').toString());

// @ts-ignore
export default defineVisWidgetConfig({
    name: 'openweathermap',
    exposes: {
        './Weather': './src/Weather',
        './translations': './src/translations',
    },
    pack,
    devServerPort: 3000,
    buildTarget: 'chrome89',
});
