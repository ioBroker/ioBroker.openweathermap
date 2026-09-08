/*!
 * ioBroker tasks
 * Date: 2025-05-19
 *
 * Node >= 22.19 strips the types itself, so this file runs directly: `node tasks.ts`.
 * That only works with erasable syntax - no `enum`, no `namespace`, no `import x = require()` -
 * and, because the package has no `"type": "module"`, with `require()` instead of `import`.
 */
'use strict';

// `import type` is erased completely, so these do not turn the file into an ES module
import type * as NodeFs from 'node:fs';
import type * as BuildTools from '@iobroker/build-tools';

const { mkdirSync, readdirSync, readFileSync, writeFileSync }: typeof NodeFs = require('node:fs');
const {
    deleteFoldersRecursive,
    npmInstall,
    buildReact,
    copyFiles,
}: typeof BuildTools = require('@iobroker/build-tools');
const pack: { name: string } = require('./package.json');

const adapterName = pack.name.replace('iobroker.', '');

const SRC = 'src-widgets/';
const src = `${__dirname}/${SRC}`;
const SRC_ADMIN = 'src-admin/';
const srcAdmin = `${__dirname}/${SRC_ADMIN}`;

function clean(): void {
    deleteFoldersRecursive(`${src}build`);
    deleteFoldersRecursive(`${__dirname}/widgets`);
}

function copyAllFiles(): void {
    copyFiles([`${SRC}build/**/*`], `widgets/${adapterName}`);
}

function cleanAdmin(): void {
    deleteFoldersRecursive(`${srcAdmin}build`);
    deleteFoldersRecursive(`${__dirname}/admin/custom`);
}

/**
 * The admin loads the i18n of a custom component from `<component>/i18n/<lang>.json` and extends the
 * global dictionary with it as-is. vis-2 in contrast prefixes the widget translations with the
 * widget set name (`translations.prefix`), which is why the shared weather components ask for
 * `openweathermap_<key>`. So the same source files are reused here, with the prefix baked in.
 */
function buildAdminI18n(): void {
    const from = `${src}src/i18n`;
    const to = `${__dirname}/admin/custom/i18n`;
    mkdirSync(to, { recursive: true });

    for (const file of readdirSync(from).filter(f => f.endsWith('.json'))) {
        const words = JSON.parse(readFileSync(`${from}/${file}`).toString('utf8')) as Record<string, string>;
        const prefixed: Record<string, string> = {};
        for (const key of Object.keys(words)) {
            prefixed[`${adapterName}_${key}`] = words[key];
        }
        writeFileSync(`${to}/${file}`, JSON.stringify(prefixed, null, 2));
    }
}

function copyAllAdminFiles(): void {
    copyFiles([`${SRC_ADMIN}build/assets/*`], 'admin/custom/assets');
    copyFiles([`${SRC_ADMIN}build/customComponents.js`], 'admin/custom');
    // The admin reads this manifest to see which component library the build was made against,
    // and refuses to start the component if it targets an older GUI API generation.
    copyFiles([`${SRC_ADMIN}build/mf-manifest.json`], 'admin/custom');
    buildAdminI18n();
}

if (process.argv.includes('--0-clean')) {
    clean();
} else if (process.argv.includes('--1-npm')) {
    npmInstall(src).catch((e: unknown) => console.error(`Cannot install npm modules: ${e as Error}`));
} else if (process.argv.includes('--2-build')) {
    buildReact(src, { rootDir: __dirname, vite: true }).catch((e: unknown) =>
        console.error(`Cannot build: ${e as Error}`),
    );
} else if (process.argv.includes('--3-copy')) {
    copyAllFiles();
} else if (process.argv.includes('--4-clean-admin')) {
    cleanAdmin();
} else if (process.argv.includes('--5-npm-admin')) {
    npmInstall(srcAdmin).catch((e: unknown) => console.error(`Cannot install npm modules: ${e as Error}`));
} else if (process.argv.includes('--6-build-admin')) {
    buildReact(srcAdmin, { rootDir: __dirname, vite: true }).catch((e: unknown) =>
        console.error(`Cannot build: ${e as Error}`),
    );
} else if (process.argv.includes('--7-copy-admin')) {
    copyAllAdminFiles();
} else {
    clean();
    cleanAdmin();
    npmInstall(src)
        .then(() => buildReact(src, { rootDir: __dirname, vite: true }))
        .then(() => copyAllFiles())
        .then(() => npmInstall(srcAdmin))
        .then(() => buildReact(srcAdmin, { rootDir: __dirname, vite: true }))
        .then(() => copyAllAdminFiles())
        .catch((e: unknown) => console.error(`Cannot build: ${e as Error}`));
}
