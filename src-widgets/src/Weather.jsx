import React from 'react';
import {
    Card, CardContent,
} from '@mui/material';

import WeatherComponent from './react-weather/Weather';

class Weather extends window.visRxWidget {
    static getWidgetInfo() {
        return {
            id: 'tplOpenWeatherMapWeather',
            visSet: 'openweathermap',
            visSetLabel: 'set_label', // Label of widget set
            visSetColor: '#1d8700', // Color of a widget set
            visWidgetLabel: 'weather',  // Label of widget
            visName: 'Weather',
            visAttrs: [
                {
                    name: 'common', // groupname
                    fields: [
                        {
                            name: 'widgetTitle',
                            label: 'title',
                            type: 'text',
                        },
                        {
                            name: 'type',
                            label: 'type',
                            type: 'select',
                            options: [
                                { value: 'all',     label: 'type_all' },
                                { value: 'current', label: 'type_current' },
                                { value: 'days',    label: 'type_days' },
                            ],
                            default: 'all',
                        },
                        {
                            name: 'days',
                            label: 'days',
                            type: 'select',
                            hidden: 'data.type === "current"',
                            options: ['6', '5', '4', '3', '2', '1'],
                            default: '6',
                            noTranslation: true,
                        },
                        {
                            label: 'instance',
                            name: 'instance',
                            type: 'instance',
                            adapter: 'openweathermap',
                            isShort: true,
                            default: '0',
                        },
                        {
                            name: 'current_temp_oid',
                            label: 'current_temp_oid',
                            tooltip: 'current_temp_oid_tooltip',
                            type: 'id',
                        },
                        {
                            name: 'current_humidity_oid',
                            label: 'current_humidity_oid',
                            tooltip: 'current_temp_oid_tooltip',
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

    static getI18nPrefix() {
        return 'openweathermap_';
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
            theme={this.props.context.theme}
        />;

        return this.wrapContent(content, null, null, null, null, { Card, CardContent });
    }
}

export default Weather;
