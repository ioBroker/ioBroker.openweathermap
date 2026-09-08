import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';
import { federation } from '@module-federation/vite';
import { moduleFederationShared } from '@iobroker/gui-components/modulefederation.admin.config';
import { readFileSync } from 'node:fs';

// The shared modules come from @iobroker/gui-components, so they stay in sync with what the admin
// host provides. Passing package.json filters the list down to the packages this component uses.
const pack = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

const config = {
    plugins: [
        federation({
            manifest: true,
            // Must be unique across all admin components and match the first segment of `name` in
            // `admin/jsonConfig.json` - two components sharing this name collide at runtime.
            name: 'ConfigCustomOpenWeatherMapSet',
            filename: 'customComponents.js',
            exposes: {
                './Components': './src/Components.tsx',
            },
            remotes: {},
            shared: moduleFederationShared(pack),
            dts: false,
        }),
        react(),
        commonjs(),
    ],
    resolve: {
        tsconfigPaths: true,
        // The weather rendering is shared with the vis-2 widget and therefore lives outside this
        // folder, next to `src-widgets/node_modules`. Without dedupe its bare imports would resolve
        // to that second copy of React/MUI/gui-components, which breaks the MUI theme context and
        // makes the federation `shared` singletons miss.
        dedupe: [
            'react',
            'react-dom',
            '@emotion/react',
            '@emotion/styled',
            '@mui/material',
            '@mui/icons-material',
            '@iobroker/gui-components',
        ],
    },
    base: './',
    build: {
        // module federation emits top level await, which needs Chrome 89 or newer
        target: 'chrome89',
        outDir: './build',
        rollupOptions: {
            onwarn(warning: { code: string }, warn: (warning: { code: string }) => void): void {
                // Suppress "Module level directives cause errors when bundled" warnings
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return;
                }
                warn(warning);
            },
        },
    },
};

export default config;
