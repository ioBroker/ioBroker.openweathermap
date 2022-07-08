const makeShared = pkgs => {
    const result = {};
    pkgs.forEach(
        packageName => {
            result[packageName] = {
                requiredVersion: '*',
                singleton: true,
            };
        },
    );
    return result;
};

module.exports = {
    name: 'Weather',
    filename: 'customWidgets.js',
    exposes: {
        './Weather': './src/Weather',
    },
    shared:
        makeShared([
            'react',
            'react-dom',
            '@mui/material',
            '@mui/styles',
            '@mui/icons-material',
            'prop-types',
            '@iobroker/adapter-react-v5',
            '@iobroker/vis-widgets-react-dev',
        ]),
};
