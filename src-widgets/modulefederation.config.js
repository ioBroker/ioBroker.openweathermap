const makeFederation = require('@iobroker/vis-widgets-react-dev/modulefederation.config');

module.exports = makeFederation(
    'openweathermap',
    {
        './Weather': './src/Weather',
    },
);
