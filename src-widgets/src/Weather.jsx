import React from 'react';
import {
    Card, CardContent,
} from '@mui/material';

import VisRxWidget from './visRxWidget';
import WeatherComponent from './react-weather/Weather';

class Weather extends (window.visRxWidget || VisRxWidget) {
    static getWidgetInfo() {
        return {
            id: 'tplOpenWeatherMapWeather',
            visSet: 'openweathermap',
            visSetLabel: 'openweathermap_set_label', // Label of widget set
            visSetColor: '#30de00', // Color of widget set
            visWidgetLabel: 'openweathermap_weather',  // Label of widget
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
                            name: 'days',
                            label: 'openweathermap_days',
                            type: 'select',
                            hidden: 'data.type === "current"',
                            options: ['6', '5', '4', '3', '2', '1'],
                            default: '6',
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
            visDefaultStyle: {
                width: 330,
                height: 185,
            },
            visPrev: 'widgets/openweathermap/img/prev_weather.png',
        };
    }

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo() {
        return Weather.getWidgetInfo();
    }

    renderWidgetBody(props) {
        super.renderWidgetBody(props);

        return <Card style={{ width: '100%', height: '100%' }}>
            <CardContent>
                <WeatherComponent
                    socket={this.props.socket}
                    instance={this.state.data.instance || 0}
                    daysCount={this.state.data.days ? parseInt(this.state.data.days, 10) : 6}
                    hideDays={this.state.data.type === 'current'}
                    hideCurrent={this.state.data.type === 'days'}
                />
            </CardContent>
        </Card>;
    }
}

export default Weather;
