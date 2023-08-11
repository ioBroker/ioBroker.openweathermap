import React, {
    useEffect, useRef, useState,
} from 'react';

import { i18n as I18n, Utils, Icon } from '@iobroker/adapter-react-v5';
import { Info as IconInfo } from '@mui/icons-material';

import { IconButton } from '@mui/material';

import cls from './style.module.scss';
import WeatherDialog, { getIcon } from './Dialog/WeatherDialog';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getWeekDay = (date, index) => {
    const dayNumber = date.getDay();
    const idx = dayNumber + index > 6 ? (dayNumber + index) - 7 : (dayNumber + index);
    return days[idx];
};

const DAY_PARAMETERS = ['temperatureMin', 'temperatureMax', 'state', 'icon', 'humidity', 'windDirection', 'windSpeed'];
const TODAY_PARAMETERS = ['temperature', 'humidity', 'title', 'icon', 'temperatureMin', 'temperatureMax', 'pressure', 'windDirection', 'windSpeed'];
const Weather = ({
    socket,
    hideCurrent,
    hideDays,
    instance,
    daysCount,
}) => {
    if (instance === undefined) {
        return;
    }

    const [dialogOpen, setDialogOpen] = useState(false);
    const mapping = useRef({});

    const [weather, setWeather] = useState({
        current: {
            temperature: null,
            humidity: null,
            title: null,
            icon: null,
        },
        days: [],
    });

    const setWeatherState = modify => {
        setWeather(oldWeather => {
            const newWeather = JSON.parse(JSON.stringify(oldWeather));
            modify(newWeather);
            // console.log(newWeather);
            return newWeather;
        });
    };

    useEffect(() => {
        const callback = (id, state) => {
            // find out the mapping
            if (mapping.current[id]) {
                if (mapping.current[id].day === undefined) {
                    setWeatherState(newWeather => newWeather.current[mapping.current[id].field] = state ? state.val : null);
                } else {
                    setWeatherState(newWeather => newWeather.days[mapping.current[id].day][mapping.current[id].field] = state ? state.val : null);
                }
            }
        };
        const subscribes = [];

        for (let t = 0; t < TODAY_PARAMETERS.length; t++) {
            const field = TODAY_PARAMETERS[t];
            const id = `openweathermap.${instance || 0}.forecast.current.${field}`;
            mapping.current[id] = { field };
            subscribes.push(id);
        }

        for (let i = 0; i < daysCount; i++) {
            for (let d = 0; d < DAY_PARAMETERS.length; d++) {
                const field = DAY_PARAMETERS[d];
                const id = `openweathermap.${instance || 0}.forecast.day${i}.${field}`;
                mapping.current[id] = { field, day: i };
                subscribes.push(id);
            }
        }

        socket.subscribeState(subscribes, callback);

        return () => {
            socket.unsubscribeState(subscribes, callback);
        };
    }, [instance]);

    const date = new Date();

    useEffect(() => {
        setWeatherState(newWeather => {
            for (let d = 0; d < daysCount; d++) {
                newWeather.days[d] = newWeather.days[d] || {
                    temperatureMin: null,
                    temperatureMax: null,
                    title: null,
                    icon: null,
                };
            }

            return newWeather;
        });
    }, [daysCount, hideCurrent, hideDays]);

    const mainIcon = getIcon(weather.current.icon, true);

    // eslint-disable-next-line consistent-return
    return <div className={cls.weatherWrapper}>
        <div className={cls.wrapperBlock} style={{ display: hideCurrent ? 'none' : undefined }}>
            <div className={cls.iconWrapper}>
                <div className={Utils.clsx(cls.iconWeatherWrapper, (!daysCount || hideDays) && cls.noteArrayIcon)}>
                    {mainIcon ? <Icon className={cls.iconWeather} src={mainIcon} /> : null}
                </div>
                <div className={cls.styleText}>{I18n.t(`openweathermap_${weather.current.title}`).replace('openweathermap_', '')}</div>
            </div>
            <div>
                <div className={cls.temperatureTop}>{`${Math.round(weather.current.temperature)}°C` || '-°C'}</div>
                <div className={cls.humidity}>{`${Math.round(weather.current.humidity)}%` || '-%'}</div>
            </div>
        </div>
        {daysCount > 0 && <div className={cls.wrapperBottomBlock} style={{ display: hideDays ? 'none' : undefined }}>
            {new Array(daysCount).fill(0).map((e, idx) => {
                const secIcon = getIcon(weather.days[idx]?.icon, true);
                return <div className={cls.wrapperBottomBlockCurrent} key={idx}>
                    <div className={cls.date}>{I18n.t(`openweathermap_${getWeekDay(date, idx + 1)}`)}</div>
                    <div>{secIcon ? <Icon className={cls.iconWeatherMin} src={secIcon} /> : null}</div>
                    <div className={cls.temperature}>{`${Math.round(weather.days[idx]?.temperatureMax)}°C` || '-°C'}</div>
                    <div className={cls.temperature}>
                        <span>{`${Math.round(weather.days[idx]?.temperatureMin)}°C` || '-°C'}</span>
                    </div>
                </div>;
            })}
        </div>}
        <div style={{ textAlign: 'right' }}>
            <IconButton onClick={() => setDialogOpen(true)}>
                <IconInfo />
            </IconButton>
        </div>
        {dialogOpen ? <WeatherDialog
            dialogKey="weather"
            onClose={() => setDialogOpen(false)}
            weather={weather}
            showCurrent={!hideCurrent}
            showDays={!hideDays}
        /> : null}
    </div>;
};

Weather.defaultProps = {
    secondsParams: false,
    hour12Params: false,
    dayOfWeekParams: false,
    date: false,
    doubleSize: false,
};

export default Weather;
