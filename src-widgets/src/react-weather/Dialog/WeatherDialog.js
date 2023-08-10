/**
 * Copyright 2018-2022 bluefox <dogafox@gmail.com>
 *
 * Licensed under the Creative Commons Attribution-NonCommercial License, Version 4.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://creativecommons.org/licenses/by-nc/4.0/legalcode.txt
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * */
import React from 'react';
import { withStyles, withTheme } from '@mui/styles';
import PropTypes from 'prop-types';

import {
    Paper, Dialog,
} from '@mui/material';

import { Utils, i18n as I18n, IconAdapter } from '@iobroker/adapter-react-v5';

import IconHydro from './icons/Humidity';
import iconPrecipitation from './icons/precipitation.svg';
import iconPressure from './icons/pressure.svg';
import iconWind from './icons/wind.svg';
import iconWindChill from './icons/windChill.svg';
import cls from './style.module.scss';
import clearSky from '../iconsWeather/clearSky.svg';
import fewClouds from '../iconsWeather/fewClouds.svg';
import scatteredClouds from '../iconsWeather/scatteredClouds.svg';
import brokenClouds from '../iconsWeather/brokenClouds.svg';
import showerRain from '../iconsWeather/showerRain.svg';
import rain from '../iconsWeather/rain.svg';
import thunderstorm from '../iconsWeather/thunderstorm.svg';
import snow from '../iconsWeather/snow.svg';
import mist from '../iconsWeather/mist.svg';

const HEIGHT_HEADER = 64;
const HEIGHT_CURRENT = 200;
const HEIGHT_DAY = 140;
const HEIGHT_CHART = 160;

const icons = [
    {
        icon: clearSky,
        name: ['01d', '01n'],
    }, {
        icon: fewClouds,
        name: ['02d', '02n'],
    }, {
        icon: scatteredClouds,
        name: ['03d', '03n'],
    }, {
        icon: brokenClouds,
        name: ['04d', '04n'],
    }, {
        icon: showerRain,
        name: ['09d', '09n'],
    }, {
        icon: rain,
        name: ['10d', '10n'],
    }, {
        icon: thunderstorm,
        name: ['11d', '11n'],
    }, {
        icon: snow,
        name: ['13d', '13n'],
    }, {
        icon: mist,
        name: ['50d', '50n'],
    },
];

export const getIcon = (nameUri, decode) => {
    let name = nameUri;
    if (decode && nameUri) {
        name = decodeURI(nameUri.toString().split('/').pop().split('.')[0]);
    }
    const search = icons.find(el => el.name.find(nameIcon => nameIcon === name));
    if (search) {
        return search.icon;
    }
    return null;
};

const styles = {
    'header-div': {
        width: 'calc(100% - 1em)',
        position: 'relative',
        marginBottom: 16,
    },
    'current-div': {
        height: HEIGHT_CURRENT,
        width: 'calc(100% - 1em)',
        position: 'relative',
        marginBottom: 16,
        overflow: 'hidden',
    },
    'currentIcon-div': {
        position: 'absolute',
        width: 128,
        height: 128,
        zIndex: 0,
        left: 3,
        top: 24,
    },
    'currentIcon-icon': {
        width: '100%',
        zIndex: 0,
    },
    'currentIcon-temperature': {
        position: 'absolute',
        width: '100%',
        fontSize: 40,
        zIndex: 1,
        fontWeight: 'normal',
        textAlign: 'right',
        color: '#9c9c9c',
        top: 8,
        right: -50,
    },
    'currentDate-div': {
        position: 'absolute',
        zIndex: 1,
        width: 'calc(100% - 2em)',
        top: 16,
        left: 16,
    },
    'currentDate-date': {
        fontWeight: 'normal',
        display: 'inline-block',
    },
    'currentDate-location': {
        display: 'inline-block',
        position: 'absolute',
        textOverflow: 'ellipsis',
        width: 'calc(100% - 75px)',
        whiteSpace: 'nowrap',
        right: 0,
        textAlign: 'right',
    },
    'todayTemp-div': {
        position: 'absolute',
        zIndex: 1,
        fontWeight: 'normal',
        top: 35,
        maxWidth: 'calc(100% - 2em - 90px)',
        right: 16,
        textAlign: 'right',
    },
    'todayTemp-temperature': {
    },
    'todayTemp-temperatureMin': {
    },
    'todayTemp-temperatureMax': {
        fontWeight: 'bold',
    },
    'todayTemp-temperatureTitle': {
    },
    'todayTemp-temperatureValue': {
    },
    'todayTemp-precipitation': {
    },
    'todayTemp-precipitationTitle': {
    },
    'todayTemp-precipitationValue': {
        paddingLeft: 2,
    },
    'todayTemp-pressure': {
    },
    'todayTemp-pressureTitle': {
    },
    'todayTemp-pressureValue': {
        paddingLeft: 2,
    },
    'todayState-div': {
        position: 'absolute',
        zIndex: 1,
        width: 'calc(100% - 90px)',
        fontWeight: 'normal',
        bottom: 16,
        left: 118,
        textAlign: 'left',
        fontSize: 14,
    },
    'todayState-wind': {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
    },
    'todayState-windTitle': {
    },
    'todayState-windDir': {
        marginLeft: 2,
    },
    'todayState-windSpeed': {
        marginLeft: 2,
    },
    'todayState-windIcon': {
        display: 'inline-block',
        marginLeft: 5,
    },
    'todayState-windChill': {
    },
    'todayState-windChillTitle': {
        paddingRight: 5,
    },
    'todayState-windChillValue': {
    },
    'todayState-humidity': {
    },
    'todayState-humidityTitle': {
        paddingRight: 5,
    },
    'todayState-humidityValue': {
    },
    'todayState-state': {
    },
    'chart-div': {
        height: HEIGHT_CHART,
        width: 'calc(100% - 1em)',
        overflowX: 'hidden',
        overflowY: 'auto',
        marginBottom: 16,
        padding: '0 16px',
        cursor: 'pointer',
    },
    'chart-header': {
        width: '100%',
        fontSize: 16,
        paddingTop: 16,
        fontWeight: 'bold',
    },
    'chart-img': {
        width: 'calc(100% - 16px)',
        height: 'calc(100% - 40px)',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
    },
    'chart-dialog': {
        zIndex: 2101,
    },
    'chart-dialog-paper': {
        width: 'calc(100% - 4em)',
        maxWidth: 'calc(100% - 4em)',
        height: 'calc(100% - 4em)',
        maxHeight: 'calc(100% - 4em)',
    },
    'chart-dialog-content': {
        width: 'calc(100% - 5em)',
        height: 'calc(100% - 4em)',
        marginLeft: '1em',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
    },

    'days-div': {
        height: `calc(100% - ${HEIGHT_CURRENT}px - ${HEIGHT_HEADER}px)`,
        width: 'calc(100% - 1em)',
        overflowX: 'hidden',
        overflowY: 'auto',
    },
    'day-div': {
        height: HEIGHT_DAY,
        width: '100%',
        marginBottom: 16,
        position: 'relative',
    },
    'dayIcon-div': {
        position: 'absolute',
        width: 90,
        height: 90,
        zIndex: 0,
        left: 16,
        top: 30,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
    },
    'dayIcon-icon': {
        width: '100%',
        zIndex: 0,
    },
    'dayIcon-temperature': {
        position: 'absolute',
        width: '100%',
        fontSize: 40,
        zIndex: 1,
        fontWeight: 'normal',
        textAlign: 'right',
        color: '#9c9c9c',
        top: 8,
        right: -50,
    },
    'dayDate-div': {
        position: 'absolute',
        zIndex: 1,
        width: 'calc(100% - 2em)',
        top: 16,
        left: 16,
    },
    'dayDate-date': {
        fontWeight: 'bold',
        display: 'inline-block',
    },
    'dayTemp-div': {
        position: 'absolute',
        zIndex: 1,
        fontWeight: 'normal',
        top: 35,
        maxWidth: 'calc(100% - 2em - 90px)',
        right: 16,
        textAlign: 'right',
    },
    'dayTemp-temperature': {
    },
    'dayTemp-temperatureMin': {
    },
    'dayTemp-temperatureMax': {
        fontWeight: 'bold',
    },
    'dayTemp-temperatureTitle': {
    },
    'dayTemp-temperatureValue': {
    },
    'dayTemp-precipitation': {
    },
    'dayTemp-precipitationTitle': {
    },
    'dayTemp-precipitationValue': {
        paddingLeft: 2,
    },
    'dayTemp-humidity': {
    },
    'dayTemp-humidityTitle': {
    },
    'dayTemp-humidityValue': {
        paddingLeft: 2,
    },
    'dayTemp-pressure': {
    },
    'dayTemp-pressureTitle': {
    },
    'dayTemp-pressureValue': {
        paddingLeft: 2,
    },
    'dayState-div': {
        position: 'absolute',
        zIndex: 1,
        width: 'calc(100% - 90px)',
        fontWeight: 'normal',
        bottom: 16,
        left: 118,
        textAlign: 'left',
    },
    'dayState-wind': {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        fontSize: 14,
    },
    'dayState-windTitle': {
    },
    'dayState-windDir': {
        marginLeft: 2,
    },
    'dayState-windSpeed': {
        marginLeft: 2,
    },
    'dayState-windIcon': {
        display: 'inline-block',
        marginLeft: 5,
        width: 16,
        maxHeight: 16,
    },
    'dayState-windChill': {
    },
    'dayState-windChillTitle': {
        paddingRight: 5,
    },
    'dayState-windChillValue': {
    },
    'dayState-state': {
        fontSize: 14,
    },

};

class WeatherDialog extends React.Component {
    getDayIconDiv(d) {
        const classes = this.props.classes;
        // const temp = this.ids.days[d].temperature && this.state[this.ids.days[d].temperature];
        let tempMin = this.props.weather.days[d].temperatureMin;
        const tempMax = this.props.weather.days[d].temperatureMax;
        let temp;
        if (tempMin !== null && tempMin !== undefined &&
             tempMax !== null && tempMax !== undefined && tempMin !== tempMax) {
            temp = [
                <span key="max" className={classes['dayTemp-temperatureMax']}>
                    {Math.round(tempMax)}
°C
                </span>,
                <span key="mid"> / </span>,
                <span key="min" className={classes['dayTemp-temperatureMin']}>
                    {Math.round(tempMin)}
°C
                </span>,
            ];
        } else if ((tempMin !== null && tempMin !== undefined) || (tempMax !== null && tempMax !== undefined)) {
            if (tempMin === null || tempMin === undefined) {
                tempMin = tempMax;
            }
            temp = <span key="max" className={classes['dayTemp-temperatureMax']}>
                {tempMin}
°
            </span>;
        }
        const humidity = this.props.weather.days[d].humidity;

        const icon = this.props.weather.days[d].icon;

        if (!temp && !icon && !humidity && humidity !== 0) {
            return null;
        }

        /// delete
        return <div key={`dayIcon${d}`} className={cls.dayIconDiv}>
            {icon ? <img className={Utils.clsx(cls.dayIconWeather, classes['dayIcon-icon'])} src={getIcon(icon, true) || icon} alt={this.props.weather.days[d].title || ''} /> : null}
            {/* <div className={cls.dayIconTemperature}>{22}°</div> */}
            {temp !== null && temp !== undefined ? <div className={cls.dayIconTemperature}>{temp}</div> : null}
            {humidity !== null && humidity !== undefined ?
                <div key={`humidity${d}`} className={cls.wrapperSpecialIcon}>
                    <IconHydro className={cls.specialIcon} />
                    <span>
                        {humidity}
%
                    </span>
                </div>
                : null}
        </div>;
    }

    static getDayDateDiv(d) {
        const now = new Date();
        now.setDate(now.getDate() + d + 1);
        const date = Utils.date2string(now);

        return <div key={`location${d}`} className={cls.dayDateDiv}>
            <div className={cls.dayDateDate}>{date}</div>
        </div>;
    }

    getDayWindDiv(d) {
        const classes = this.props.classes;
        const windChill = this.props.weather.days[d].windchill;
        let windDir = this.props.weather.days[d].windDirection;
        if (windDir !== null && windDir !== undefined && (typeof windDir === 'number' || parseInt(windDir, 10) === windDir)) {
            windDir = I18n.t(`openweathermap_wind_${Utils.getWindDirection(windDir)}`).replace('openweathermap_wind_', '');
        }
        const windSpeed = this.props.weather.days[d].windSpeed;
        const windIcon = this.props.weather.days[d].windIcon;

        const state = this.props.weather.days[d].title;

        if (!state && !windChill && windChill !== 0 && !windDir && !windSpeed && windSpeed !== 0) {
            return null;
        }

        return <div key={`dayWind${d}`} className={cls.dayStateDiv}>
            {windChill !== null && windChill !== undefined ?
                <div key={`windChill${d}`} className={cls.wrapperSpecialIcon}>
                    {/* <span className={cls.todayStateName}>{I18n.t('openweathermap_Windchill')}: </span> */}
                    <IconAdapter src={iconWindChill} className={cls.specialIcon} />
                    <span className={classes['dayState-windChillValue']}>
                        {/* {windChill} */}
                        {windSpeed}
                        {this.props.windUnit}
                    </span>
                </div>
                : null}

            {(windDir !== null && windDir !== undefined) || (windSpeed !== null && windSpeed !== undefined) ?
                <div key={`wind${d}`} className={cls.wrapperSpecialIcon}>
                    {/* <span key={'windTitle' + d} className={cls.todayStateName}>{I18n.t('openweathermap_Wind')}:</span> */}
                    <img src={iconWind} className={cls.specialIcon} alt="" />
                    <div>
                        {windIcon ? <img className={classes['dayState-windIcon']} src={getIcon(windIcon, true) || windIcon} alt="state" /> : null}
                        {windDir ? <span className={classes['dayState-windDir']}>{windDir}</span> : null}
                        {windSpeed !== null && windSpeed !== undefined && !Number.isNaN(windSpeed) ? <span key={`daySpeed${d}`} className={classes['dayState-windSpeed']}>
                            {Math.round(windSpeed)}
                            {I18n.t('openweathermap_m_s')}
                            {this.props.windUnit}
                        </span> : null}
                    </div>
                </div>
                : null}

            {/* {state ? <div key={'state' + d} className={classes['dayState-state']}>{state}</div> : null} */}
        </div>;
    }

    getDayTempDiv(d) {
        const classes = this.props.classes;
        const precipitation = this.props.weather.days[d].precipitation;
        const pressure = this.props.weather.days[d].pressure;

        if (!precipitation && precipitation !== 0 && !pressure && pressure !== 0) {
            return null;
        }

        return <div key={`dayTemp${d}`} className={cls.dayTempDiv}>
            {precipitation !== null && precipitation !== undefined ?
                <div key={`precipitation${d}`} className={cls.wrapperSpecialIcon}>
                    <IconAdapter src={iconPrecipitation} className={cls.specialIcon} />
                    <span className={classes['dayTemp-precipitationValue']}>
                        {precipitation}
%
                    </span>
                </div>
                : null}
            {pressure !== null && pressure !== undefined ?
                <div key={`pressure${d}`} className={cls.wrapperSpecialIcon}>
                    <IconAdapter src={iconPressure} className={cls.specialIcon} />
                    <span className={classes['dayTemp-pressureValue']}>
                        {pressure}
                        {this.props.pressureUnit}
                    </span>
                </div>
                : null}
        </div>;
    }

    getDayDiv(d) {
        if (!this.props.weather.days[d]) return null;
        const parts = [
            WeatherDialog.getDayDateDiv(d),
            this.getDayIconDiv(d), //
            this.getDayWindDiv(d),
            this.getDayTempDiv(d),
        ];

        if (!parts[0] && !parts[2] && !parts[3]) {
            return null;
        }

        return <Paper key={`day${d}`} style={{ backgroundColor: this.props.theme.palette.background.paper }} className={cls.dayDiv}>{parts}</Paper>;
    }

    getCurrentIconDiv() {
        const temp = this.props.weather.current.temperature;

        return <div key="todayIcon" className={cls.currentIconDiv}>
            <img className={cls.currentIconIcon} src={getIcon(this.props.weather.current?.icon, true) || ''} alt="current" />
            {temp !== null && temp !== undefined ? <div className={cls.currentIconTemperature}>
                {Math.round(temp)}
°C
            </div> : null}
        </div>;
    }

    static getCurrentDateLocationDiv() {
        const date = Utils.date2string(new Date());
        const location = I18n.t('openweathermap_Weather');

        return <div key="location" className={cls.currentDateDiv}>
            <div className={cls.currentDateDate}>{date}</div>
            <div className={cls.currentDateLocation}>{location}</div>
        </div>;
    }

    getTodayWindDiv() {
        const classes = this.props.classes;
        const windChill = this.props.weather.current.windchill;
        let windDir = this.props.weather.current.windDirection;
        if (windDir !== null && windDir !== undefined && (typeof windDir === 'number' || parseInt(windDir, 10) === windDir)) {
            windDir = I18n.t(`openweathermap_wind_${Utils.getWindDirection(windDir)}`).replace('openweathermap_wind_', '');
        }

        const windSpeed = this.props.weather.current.windSpeed;
        const windIcon = this.props.weather.current.windIcon;
        const humidity = this.props.weather.current.humidity;

        const state = this.props.weather.current.title;
        return <div key="todayWind" className={cls.todayStateDiv}>
            {windChill !== null && windChill !== undefined ?
                <div key="windChill" className={classes['todayState-windChill']}>
                    <span className={cls.todayStateName}>
                        {I18n.t('openweathermap_Windchill')}
:
                        {' '}
                    </span>
                    <span className={classes['todayState-windChillValue']}>{windChill}</span>
                </div>
                : null}

            {(windDir !== null && windDir !== undefined) || (windSpeed !== null && windSpeed !== undefined) ?
                <div key="wind" className={classes['todayState-wind']}>
                    <span key="windTitle" className={cls.todayStateName}>
                        {I18n.t('openweathermap_Wind')}
:
                    </span>
                    {windIcon ? <img className={classes['todayState-windIcon']} src={getIcon(windIcon, true) || windIcon} alt="state" /> : null}
                    {windDir ? <span className={classes['todayState-windDir']}>{windDir}</span> : null}
                    {windSpeed !== null && windSpeed !== undefined && !Number.isNaN(windSpeed) ? <span key="windSpeed" className={classes['todayState-windSpeed']}>
                        {Math.round(windSpeed)}
                        {' m/s'}

                    </span> : null}
                </div>
                : null}

            {humidity || humidity === 0 ?
                <div key="humidity" className={classes['todayState-humidity']}>
                    <span className={cls.todayStateName}>
                        {I18n.t('openweathermap_Humidity')}
:
                        {' '}
                    </span>
                    <span className={classes['todayState-humidityValue']}>
                        {humidity}
%
                    </span>
                </div>
                : null}

            {state ? <div key="state" className={classes['todayState-state']}>{I18n.t(`openweathermap_${state}`).replace('openweathermap_', '')}</div> : null}
        </div>;
    }

    getTodayTempDiv() {
        const classes = this.props.classes;
        const tempMin = this.props.weather.current?.temperatureMin;
        const tempMax = this.props.weather.current?.temperatureMax;
        const precipitation = this.props.weather.current?.precipitation;
        const pressure = this.props.weather.current?.pressure;

        let temp;
        if (tempMin !== null && tempMin !== undefined && tempMax !== null && tempMax !== undefined) {
            temp = [
                <span key="max" className={cls.tempMax}>
                    {Math.round(tempMax)}
°
                </span>,
                <span key="mid"> / </span>,
                <span key="min">
                    {Math.round(tempMin)}
°
                </span>,
            ];
        }

        return <div key="todayTemp" className={cls.todayTempDiv}>
            {temp !== null && temp !== undefined ?
                <div key="temp" className={classes['todayTemp-temperature']}>
                    <span className={classes['todayTemp-temperatureValue']}>{temp}</span>
                </div>
                : null}

            {precipitation !== null && precipitation !== undefined ?
                <div key="precipitation" className={classes['todayTemp-precipitation']}>
                    <span key="windTitle" className={cls.todayStateName}>
                        {I18n.t('openweathermap_Precip.')}
:
                    </span>
                    <span className={classes['todayTemp-precipitationValue']}>
                        {precipitation}
%
                    </span>
                </div>
                : null}

            {pressure !== null && pressure !== undefined ?
                <div key="pressure" className={classes['todayTemp-pressure']}>
                    <span key="windTitle" className={cls.todayStateName}>
                        {I18n.t('openweathermap_Pressure')}
:
                    </span>
                    <span className={classes['todayTemp-pressureValue']}>
                        {pressure}
                        {' hPa'}
                        {this.props.pressureUnit}
                    </span>
                </div>
                : null}
        </div>;
    }
    /*
    getChartDiv() {
        const classes = this.props.classes;
        let chart = this.ids.current.chart && this.state[this.ids.current.chart];
        if (chart && chart.toLowerCase().match(/\.svg$|\.jpg$|\.jpeg$|\.gif$|\.png$/)) {
            if (!chart.includes('?')) {
                chart += `?ts=${Date.now()}`;
            } else {
                chart += `&ts=${Date.now()}`;
            }
            return [
                <Paper key="chart" className={this.props.classes['chart-div']} onClick={() => this.setState({ chartOpened: true })}>
                    <div className={classes['chart-header']}>{I18n.t('openweathermap_Chart')}</div>
                    <div
                        className={classes['chart-img']}
                        style={{
                            backgroundImage: `url(${this.state[this.ids.current.chart]})`,
                        }}
                    />
                </Paper>,
                this.state.chartOpened ? <Dialog
                    key="chart-dialog"
                    open
                    classes={{ paper: this.props.classes['chart-dialog-paper'] }}
                    onClose={() => this.setState({ chartOpened: false })}
                    className={this.props.classes['chart-dialog']}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{I18n.t('openweathermap_Chart')}</DialogTitle>
                    <DialogContent
                        className={this.props.classes['chart-dialog-content']}
                        style={{ backgroundImage: `url(${chart})` }}
                    />
                    <DialogActions>
                        <Button
                            onClick={() => this.setState({ chartOpened: false })}
                            color="primary"
                            autoFocus
                            variant="contained"
                            startIcon={<IconClose />}
                        >
                            {I18n.t('openweathermap_Close')}
                        </Button>
                    </DialogActions>
                </Dialog> : null];
        }
        return null;
    }
    */

    getDaysDiv() {
        const days = this.props.weather.days.map((d, index) => this.getDayDiv(index));
        // if (this.props.settings.chartLast) {
        //     days.push(this.getChartDiv());
        // } else {
        //     days.unshift(this.getChartDiv());
        // }
        if (days.length) {
            return <div key="allDays" className={cls.daysDiv}>{days}</div>;
        }
        return null;
    }

    getCurrentDiv() {
        return <Paper
            style={{ backgroundColor: this.props.theme.palette.background.paper }}
            key="current"
            className={cls.currentDiv}
        >
            {this.getCurrentIconDiv()}
            {WeatherDialog.getCurrentDateLocationDiv()}
            {this.getTodayWindDiv()}
            {this.getTodayTempDiv()}
        </Paper>;
    }

    generateContent() {
        return <div className={cls.wrapperBlockWeather}>
            {[
                this.getCurrentDiv(),
                this.getDaysDiv(),
            ]}
        </div>;
    }

    render() {
        return <Dialog
            open={!0}
            onClose={this.props.onClose}
            fullWidth
            maxWidth="md"
            classes={{
                scrollPaper: cls.dialog,
                paper: cls.dialog,
                container: cls.dialog,
            }}
        >
            {this.generateContent()}
        </Dialog>;
    }
}

WeatherDialog.propTypes = {
    /*
        name: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.object,
        ]),
    */
    // dialogKey: PropTypes.string.isRequired,
    // windowWidth: PropTypes.number,
    onClose: PropTypes.func.isRequired,
    // objects: PropTypes.object,
    // states: PropTypes.object,
    // onCollectIds: PropTypes.func,
    // enumNames: PropTypes.array,
    // ids: PropTypes.object.isRequired,
    // settings: PropTypes.object,
};

export default withStyles(styles)(withTheme(WeatherDialog));
