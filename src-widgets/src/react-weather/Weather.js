import React, {
    useEffect, useState,
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

    const currentCallback = (field, state) =>
        setWeatherState(newWeather => newWeather.current[field] = state?.val || null);

    const dayCallback = (day, field, state) =>
        setWeatherState(newWeather => newWeather.days[day][field] = state?.val || null);

    const getSubscribeState = (id, cb) => {
        socket.getState(id)
            .then(result => cb(id, result));

        socket.subscribeState(id, cb);
    };

    useEffect(() => {
        const callbacks = {};
        const dayCallbacks = [];
        ['temperature', 'humidity', 'title', 'icon', 'temperatureMin', 'temperatureMax', 'pressure', 'windDirection', 'windSpeed']
            .forEach(field => {
                const callback = (id, state) => currentCallback(field, state);
                getSubscribeState(`openweathermap.${instance || 0}.forecast.current.${field}`, callback);
                callbacks[field] = callback;
            });

        for (let i = 0; i < daysCount; i++) {
            ['temperatureMin', 'temperatureMax', 'state', 'icon', 'humidity', 'windDirection', 'windSpeed']
                .forEach(field => {
                    const callback = (id, state) => dayCallback(i, field, state);
                    getSubscribeState(`openweathermap.${instance || 0}.forecast.day${i}.${field}`, callback);
                    if (!dayCallbacks[i]) {
                        dayCallbacks[i] = {};
                    }
                    dayCallbacks[i][field] = callback;
                });
        }

        return () => {
            for (const field in callbacks) {
                socket.unsubscribeState(`openweathermap.${instance || 0}.forecast.current.${field}`, callbacks[field]);
            }
            for (let i = 0; i < daysCount; i++) {
                for (const field in callbacks) {
                    socket.unsubscribeState(`openweathermap.${instance || 0}.forecast.day${i}.${field}`, dayCallbacks[i][field]);
                }
            }
        };
    }, [instance]);

    const date = new Date();

    useEffect(() => {
        setWeatherState(newWeather => {
            Array(daysCount).fill().forEach((_, i) => {
                if (!newWeather.days[i]) {
                    newWeather.days[i] = {
                        temperatureMin: null,
                        temperatureMax: null,
                        title: null,
                        icon: null,
                    };
                }
            });

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
        <WeatherDialog
            dialogKey="weather"
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            weather={weather}
            showCurrent={!hideCurrent}
            showDays={!hideDays}
        />
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
