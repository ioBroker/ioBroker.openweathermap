import React from 'react';

import { Paper } from '@mui/material';

// important to import from the package and not from some children.
// invalid: import ConfigGeneric from '@iobroker/json-config/ConfigGeneric';
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { I18n, InfoBox } from '@iobroker/gui-components';

// The very same component the vis-2 widget renders
import WeatherComponent from '../../src-widgets/src/react-weather/Weather';

/** Attributes this component accepts in `admin/jsonConfig.json` in addition to the standard ones */
interface ConfigWeatherSchema {
    /** How many forecast days to show. Default 6 */
    days?: number;
    /** Height of the preview in pixels. Default 185 */
    height?: number;
}

interface ConfigWeatherState extends ConfigGenericState {
    /** `null` as long as the first read is still running */
    hasData: boolean | null;
}

export default class ConfigWeather extends ConfigGeneric<ConfigGenericProps, ConfigWeatherState> {
    /** The one state that decides whether there is anything to show at all */
    private readonly probeId: string;

    /** `subscribeState` reports the current value only for states that exist */
    private probeAnswered = false;

    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            hasData: null,
        };
        this.probeId = `openweathermap.${props.oContext.instance}.forecast.current.temperature`;
    }

    async componentDidMount(): Promise<void> {
        await super.componentDidMount();

        // A freshly created instance has no states yet - showing "--°C" for everything would just
        // look broken, so tell the user that the first fetch is still pending instead. This is a
        // subscription and not a single read, because the typical moment to sit in this dialog is
        // right after entering the API key, waiting for the first scheduled request to come in.
        try {
            await this.props.oContext.socket.subscribeState(this.probeId, this.onProbeState);
        } catch {
            // ignore - handled by the check below
        }

        // `subscribeState` calls the handler with the current value before it resolves, but only if
        // the state exists at all. Silence therefore means "nothing fetched yet", not "still loading".
        if (!this.probeAnswered) {
            this.setState({ hasData: false });
        }
    }

    componentWillUnmount(): void {
        this.props.oContext.socket.unsubscribeState(this.probeId, this.onProbeState);
        super.componentWillUnmount();
    }

    onProbeState = (_id: string, state: ioBroker.State | null | undefined): void => {
        this.probeAnswered = true;
        const hasData = state?.val !== null && state?.val !== undefined;
        if (hasData !== this.state.hasData) {
            this.setState({ hasData });
        }
    };

    renderItem(_error: string, _disabled: boolean, _defaultValue?: unknown): React.JSX.Element | null {
        const schema = this.props.schema as ConfigWeatherSchema;

        if (this.state.hasData === null) {
            // do not flash the "no data" box while the check is still running
            return null;
        }

        if (!this.state.hasData) {
            return (
                <InfoBox
                    type="info"
                    iconPosition="top"
                >
                    {I18n.t('No weather data yet. The preview appears after the first successful request.')}
                </InfoBox>
            );
        }

        return (
            <Paper
                style={{
                    padding: 16,
                    width: '100%',
                    height: schema.height || 185,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
            >
                <WeatherComponent
                    socket={this.props.oContext.socket}
                    instance={this.props.oContext.instance}
                    daysCount={schema.days === undefined ? 6 : schema.days}
                    hideCurrent={false}
                    hideDays={false}
                    currentTemp={null}
                    currentHumidity={null}
                    isFloatComma={this.props.oContext.isFloatComma}
                    theme={this.props.oContext.theme}
                    // follow the checkbox while it is being edited, not the saved value
                    tempUnit={this.props.data.imperial ? '°F' : '°C'}
                    pressureUnit="hPa"
                />
            </Paper>
        );
    }
}
