import React, { useEffect, useRef, useState } from 'react';

import { IconButton } from '@mui/material';

import { Info as IconInfo } from '@mui/icons-material';

import { I18n, Utils, Icon, type LegacyConnection } from '@iobroker/adapter-react-v5';

import type { VisTheme } from '@iobroker/types-vis-2';

import cls from './style.module.scss';
import WeatherDialog, { getIcon, type WeatherData } from './Dialog/WeatherDialog';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekDay(date: Date, index: number): string {
    const dayNumber = date.getDay();
    const idx = dayNumber + index > 6 ? dayNumber + index - 7 : dayNumber + index;
    return days[idx];
}
type WEATHER_DAY_PARAMETERS =
    | 'temperatureMin'
    | 'temperatureMax'
    | 'state'
    | 'icon'
    | 'humidity'
    | 'windDirection'
    | 'windSpeed';

type WEATHER_TODAY_PARAMETERS =
    | 'temperature'
    | 'humidity'
    | 'title'
    | 'icon'
    | 'temperatureMin'
    | 'temperatureMax'
    | 'pressure'
    | 'windDirection'
    | 'windSpeed';
const DAY_PARAMETERS: WEATHER_DAY_PARAMETERS[] = [
    'temperatureMin',
    'temperatureMax',
    'state',
    'icon',
    'humidity',
    'windDirection',
    'windSpeed',
];
const TODAY_PARAMETERS: WEATHER_TODAY_PARAMETERS[] = [
    'temperature',
    'humidity',
    'title',
    'icon',
    'temperatureMin',
    'temperatureMax',
    'pressure',
    'windDirection',
    'windSpeed',
];

interface WeatherProps {
    socket: LegacyConnection;
    hideCurrent: boolean;
    hideDays: boolean;
    instance: number;
    daysCount: number;
    currentTemp: number | null;
    currentHumidity: number | null;
    isFloatComma: boolean;
    tempUnit: '°C' | '°F';
    pressureUnit: 'hPa' | 'PSI';
    theme: VisTheme;
}

export default function Weather({
    socket,
    hideCurrent,
    hideDays,
    instance,
    daysCount,
    currentTemp,
    currentHumidity,
    isFloatComma,
    theme,
    tempUnit,
    pressureUnit,
}: WeatherProps): React.JSX.Element | null {
    const [dialogOpen, setDialogOpen] = useState(false);
    const mapping = useRef<{
        [oid: string]: { field: WEATHER_TODAY_PARAMETERS | WEATHER_DAY_PARAMETERS; day?: number };
    }>({});

    const [weather, setWeather] = useState<WeatherData>({
        current: {
            temperature: null,
            humidity: null,
            title: null,
            icon: null,
        },
        days: [],
    });

    const setWeatherState = (modify: (data: WeatherData) => void): void => {
        setWeather(oldWeather => {
            const newWeather: WeatherData = JSON.parse(JSON.stringify(oldWeather));
            modify(newWeather);
            return newWeather;
        });
    };

    useEffect(() => {
        const callback = (id: string, state: ioBroker.State | null | undefined): void => {
            // find out the mapping
            if (mapping.current[id]) {
                if (mapping.current[id].day === undefined) {
                    setWeatherState(newWeather => {
                        // @ts-expect-error
                        newWeather.current[mapping.current[id].field as WEATHER_TODAY_PARAMETERS] = state
                            ? (state.val as number)
                            : null;
                    });
                } else {
                    setWeatherState(newWeather => {
                        // @ts-expect-error
                        newWeather.days[mapping.current[id].day][mapping.current[id].field] = state ? state.val : null;
                    });
                }
            }
        };
        const subscribes: string[] = [];

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

        void socket.subscribeState(subscribes, callback);

        return () => socket.unsubscribeState(subscribes, callback);
    }, [instance, socket, daysCount]);

    const date = new Date();

    useEffect(() => {
        setWeatherState((newWeather: WeatherData) => {
            for (let d = 0; d < daysCount; d++) {
                newWeather.days[d] ||= {
                    temperatureMin: null,
                    temperatureMax: null,
                    title: null,
                    icon: null,
                };
            }

            return newWeather;
        });
    }, [daysCount, hideCurrent, hideDays]);

    if (instance === undefined) {
        return null;
    }

    const mainIcon = getIcon(weather.current.icon, true);

    const temp: number | null =
        currentTemp !== null
            ? Math.round(currentTemp * 10) / 10
            : weather.current.temperature !== undefined && weather.current.temperature !== null
              ? Math.round(weather.current.temperature)
              : null;

    const humidity: number | null =
        currentHumidity !== null
            ? Math.round(currentHumidity)
            : weather.current.humidity !== undefined && weather.current.humidity !== null
              ? Math.round(weather.current.humidity)
              : null;

    let tempStr: string = temp !== null ? temp.toString() : '--';
    if (isFloatComma) {
        tempStr = tempStr.replace('.', ',');
    }

    return (
        <div className={cls.weatherWrapper}>
            <div
                className={cls.wrapperBlock}
                style={{ display: hideCurrent ? 'none' : undefined }}
            >
                <div className={cls.iconWrapper}>
                    <div className={Utils.clsx(cls.iconWeatherWrapper, (!daysCount || hideDays) && cls.noteArrayIcon)}>
                        {mainIcon ? (
                            <Icon
                                className={cls.iconWeather}
                                src={mainIcon}
                            />
                        ) : null}
                    </div>
                    <div className={cls.styleText}>
                        {I18n.t(`openweathermap_${weather.current.title}`).replace('openweathermap_', '')}
                    </div>
                </div>
                <div>
                    <div className={cls.temperatureTop}>{`${tempStr ?? '-'}${tempUnit}`}</div>
                    <div className={cls.humidity}>{`${humidity ?? '--'}%`}</div>
                </div>
            </div>
            {daysCount > 0 && (
                <div
                    className={cls.wrapperBottomBlock}
                    style={{ display: hideDays ? 'none' : undefined }}
                >
                    {new Array(daysCount).fill(0).map((_e, idx) => {
                        const secIcon = getIcon(weather.days[idx]?.icon, true);
                        const max = weather.days[idx]?.temperatureMax;
                        const min = weather.days[idx]?.temperatureMin;

                        return (
                            <div
                                className={cls.wrapperBottomBlockCurrent}
                                key={idx}
                            >
                                <div className={cls.date}>{I18n.t(`openweathermap_${getWeekDay(date, idx)}`)}</div>
                                <div>
                                    {secIcon ? (
                                        <Icon
                                            className={cls.iconWeatherMin}
                                            src={secIcon}
                                        />
                                    ) : null}
                                </div>
                                <div className={cls.temperature}>
                                    {`${max !== null && max !== undefined ? Math.round(max) : '--'}${tempUnit}`}
                                </div>
                                <div className={cls.temperature}>
                                    <span>{`${min !== null && min !== undefined ? Math.round(min) : '--'}${tempUnit}`}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            <div style={{ textAlign: 'right' }}>
                <IconButton onClick={() => setDialogOpen(true)}>
                    <IconInfo />
                </IconButton>
            </div>
            {dialogOpen ? (
                <WeatherDialog
                    onClose={() => setDialogOpen(false)}
                    weather={weather}
                    theme={theme}
                    windUnit={tempUnit}
                    pressureUnit={pressureUnit}
                    tempUnit={tempUnit}
                />
            ) : null}
        </div>
    );
}
