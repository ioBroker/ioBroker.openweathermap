import React from 'react';

import type { RxRenderWidgetProps, RxWidgetInfo, VisRxWidgetState } from '@iobroker/types-vis-2';
import type VisRxWidget from '@iobroker/types-vis-2/visRxWidget';

import WeatherComponent from './react-weather/Weather';

interface WeatherState extends VisRxWidgetState {
    tempUnit: '°C' | '°F';
    pressureUnit: 'hPa';
}

interface WeatherRxData {
    widgetTitle: string;
    type: 'all' | 'current' | 'days';
    days: '6' | '5' | '4' | '3' | '2' | '1';
    instance: `${number}`;
    current_temp_oid: string;
    current_humidity_oid: string;
}

export default class Weather extends (window.visRxWidget as typeof VisRxWidget)<WeatherRxData, WeatherState> {
    private askedInstance: string | undefined;

    static getWidgetInfo(): RxWidgetInfo {
        return {
            id: 'tplOpenWeatherMapWeather',
            visSet: 'openweathermap',
            visSetLabel: 'set_label', // Label of widget set
            visSetColor: '#1d8700', // Color of a widget set
            visWidgetLabel: 'weather', // Label of widget
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
                                { value: 'all', label: 'type_all' },
                                { value: 'current', label: 'type_current' },
                                { value: 'days', label: 'type_days' },
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
                            // @ts-expect-error fixed in vis-2 types
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

    // eslint-disable-next-line class-methods-use-this
    getWidgetInfo(): RxWidgetInfo {
        return Weather.getWidgetInfo();
    }

    detectMetricOrImperial(): void {
        if (this.askedInstance !== this.state.rxData.instance && this.state.rxData.instance) {
            this.askedInstance = this.state.rxData.instance;

            setTimeout(() => {
                void this.props.context.socket
                    .getObject(`system.adapter.openweathermap.${this.state.rxData.instance}`)
                    .then(obj => {
                        if (obj?.native) {
                            this.setState({
                                tempUnit: obj?.native.imperial ? '°F' : '°C',
                                pressureUnit: 'hPa',
                            });
                        }
                    });
            }, 50);
        }
    }

    componentDidMount(): void {
        super.componentDidMount();
        this.detectMetricOrImperial();
    }

    renderWidgetBody(props: RxRenderWidgetProps): React.JSX.Element | React.JSX.Element[] | null {
        super.renderWidgetBody(props);

        this.detectMetricOrImperial();

        const content = (
            <WeatherComponent
                socket={this.props.context.socket}
                instance={parseInt(this.state.rxData.instance, 10) || 0}
                daysCount={this.state.rxData.days ? parseInt(this.state.rxData.days, 10) : 6}
                hideDays={this.state.rxData.type === 'current'}
                hideCurrent={this.state.rxData.type === 'days'}
                currentTemp={
                    this.state.rxData.current_temp_oid
                        ? this.state.values[`${this.state.rxData.current_temp_oid}.val`]
                        : null
                }
                currentHumidity={
                    this.state.rxData.current_humidity_oid
                        ? this.state.values[`${this.state.rxData.current_humidity_oid}.val`]
                        : null
                }
                isFloatComma={this.props.context?.systemConfig?.common?.isFloatComma}
                theme={this.props.context.theme}
                tempUnit={this.state.tempUnit || '°C'}
                pressureUnit={this.state.pressureUnit || 'hPa'}
            />
        );

        return this.wrapContent(content);
    }
}
