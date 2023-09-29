import React from 'react';
import {
    Card, CardContent,
} from '@mui/material';

import { VisRxWidget } from '@iobroker/vis-2-widgets-react-dev';
import WeatherComponent from './react-weather/Weather';

class Weather extends (window.visRxWidget || VisRxWidget) {
    static getWidgetInfo() {
        return {
            id: 'tplOpenWeatherMapWeather',
            visSet: 'openweathermap',
            visSetLabel: 'openweathermap_set_label', // Label of widget set
            visSetColor: '#1d8700', // Color of a widget set
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
                            noTranslation: true,
                        },
                        {
                            label: 'openweathermap_instance',
                            name: 'instance',
                            type: 'instance',
                            adapter: 'openweathermap',
                            isShort: true,
                            default: '0',
                        },
                        {
                            name: 'current_temp_oid',
                            label: 'openweathermap_current_temp_oid',
                            tooltip: 'openweathermap_current_temp_oid_tooltip',
                            type: 'id',
                        },
                        {
                            name: 'current_humidity_oid',
                            label: 'openweathermap_current_humidity_oid',
                            tooltip: 'openweathermap_current_temp_oid_tooltip',
                            type: 'id',
                        },
                    ],
                },
            ],
            visDefaultStyle: {
                width: '100%',
                height: 185,
                position: 'relative',
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

        const content = <WeatherComponent
            socket={this.props.context.socket}
            instance={this.state.rxData.instance || 0}
            daysCount={this.state.rxData.days ? parseInt(this.state.rxData.days, 10) : 6}
            hideDays={this.state.rxData.type === 'current'}
            hideCurrent={this.state.rxData.type === 'days'}
            currentTemp={this.state.rxData.current_temp_oid ? this.state.values[`${this.state.rxData.current_temp_oid}.val`] : null}
            currentHumidity={this.state.rxData.current_humidity_oid ? this.state.values[`${this.state.rxData.current_humidity_oid}.val`] : null}
            isFloatComma={this.props.context?.systemConfig?.common?.isFloatComma}
        />;

        return this.wrapContent(content, null, null, null, null, { Card, CardContent });
    }
}

export default Weather;
