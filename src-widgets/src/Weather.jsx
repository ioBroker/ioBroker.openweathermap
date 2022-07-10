import React from 'react';
import {
    Card, CardContent,
} from '@mui/material';

import VisRxWidget from '@iobroker/vis-widgets-react-dev/visRxWidget';
import WeatherComponent from './react-weather/Weather';

class Weather extends (window.visRxWidget || VisRxWidget) {
    static getWidgetInfo() {
        return {
            id: 'tplOpenWeatherMapWeather',
            visSet: 'openweathermap',
            visName: 'Weather',
            visAttrs: [
                {
                    name: 'common', // groupname
                    fields: [
                        {
                            name: 'type',
                            label: 'openweathermap_type',
                            type: 'select',
                            options: [
                                { value: 'all',     label: 'openweathermap_type_all' },
                                { value: 'current', label: 'openweathermap_type_current' },
                                { value: 'days',    label: 'openweathermap_type_days' },
                            ],
                            default: 'all',
                        },
                        {
                            label: 'openweathermap_instance',
                            name: 'instance',
                            type: 'instance',
                            adapter: 'openweathermap',
                            isShort: true,
                            default: '0',
                        },
                    ],
                },
            ],
            visPrev: 'widgets/openweathermap/img/prev_weather.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo() {
        return Weather.getWidgetInfo();
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        return <Card
            style={{ width: '100%', height: '100%' }}
        >
            <CardContent>
                <WeatherComponent
                    socket={this.props.socket}
                    instance={this.state.data.instance || 0}
                    daysCount={6}
                    hideDays={this.state.data.type === 'current'}
                    hideCurrent={this.state.data.type === 'days'}
                />
            </CardContent>
        </Card>;
    }
}

export default Weather;
