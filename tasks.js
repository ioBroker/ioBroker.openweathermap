/*!
 * ioBroker tasks
 * Date: 2025-05-19
 */
'use strict';

const adapterName = require('./package.json').name.replace('iobroker.', '');
const { deleteFoldersRecursive, npmInstall, buildReact, copyFiles } = require('@iobroker/build-tools');

const SRC = 'src-widgets/';
const src = `${__dirname}/${SRC}`;

function clean() {
    deleteFoldersRecursive(`${src}build`);
    deleteFoldersRecursive(`${__dirname}/widgets`);
}

function copyAllFiles() {
    copyFiles([`${SRC}build/customWidgets.js`], `widgets/${adapterName}`);
    copyFiles([`${SRC}build/assets/*.*`], `widgets/${adapterName}/assets`);
    copyFiles([`${SRC}build/img/*`], `widgets/${adapterName}/img`);
}

if (process.argv.includes('--0-clean')) {
    clean();
} else if (process.argv.includes('--1-npm')) {
    npmInstall(src).catch(e => console.error(`Cannot install npm modules: ${e}`));
} else if (process.argv.includes('--2-build')) {
    buildReact(src, { rootDir: __dirname, vite: true }).catch(e => console.error(`Cannot build: ${e}`));
} else if (process.argv.includes('--3-copy')) {
    copyAllFiles();
} else {
    clean();
    npmInstall(src)
        .then(() => buildReact(src, { rootDir: __dirname, vite: true }))
        .then(() => copyAllFiles())
        .catch(e => console.error(`Cannot build: ${e}`));
}
