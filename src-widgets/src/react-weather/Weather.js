import React, {
    createRef, useEffect, useRef, useState, useCallback,
} from 'react';

import { i18n as I18n, Utils, Icon } from '@iobroker/adapter-react-v5';

import cls from './style.module.scss';
import clearSky from './iconsWeather/clearSky.svg';
import fewClouds from './iconsWeather/fewClouds.svg';
import scatteredClouds from './iconsWeather/scatteredClouds.svg';
import brokenClouds from './iconsWeather/brokenClouds.svg';
import showerRain from './iconsWeather/showerRain.svg';
import rain from './iconsWeather/rain.svg';
import thunderstorm from './iconsWeather/thunderstorm.svg';
import snow from './iconsWeather/snow.svg';
import mist from './iconsWeather/mist.svg';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

const getWeekDay = (date, index) => {
    const dayNumber = date.getDay();
    const idx = dayNumber + index > 6 ? (dayNumber + index) - 7 : (dayNumber + index);
    return days[idx];
};

const Weather = ({
    socket,
    data,
    hideCurrent,
    hideDays,
}) => {
    if (!data) {
        return;
    }
    const [title, setTitle] = useState('');
    const [iconName, setIconName] = useState('');

    const titleCallBack = (_, state) => {
        if (state?.val) {
            setTitle(state.val);
        } else {
            setTitle(null);
        }
    };

    const iconCallBack = (_, state) => {
        if (state?.val) {
            setIconName(state.val || '');
        } else {
            setIconName(null);
        }
    };

    useEffect(() => {
        data.current.temperature && getSubscribeState(data.current.temperature, temperatureCallBack);
        data.current.humidity && getSubscribeState(data.current.humidity, humidityCallBack);
        data.current.state && getSubscribeState(data.current.state, titleCallBack);
        data.current.icon && getSubscribeState(data.current.icon, iconCallBack);

        return () => {
            data.current.temperature && socket.unsubscribeState(data.current.temperature, temperatureCallBack);
            data.current.humidity && socket.unsubscribeState(data.current.humidity, humidityCallBack);
            data.current.state && socket.unsubscribeState(data.current.state, titleCallBack);
            data.current.icon && socket.unsubscribeState(data.current.icon, iconCallBack);
        };
    }, [data]);

    const temperature = useRef();
    const humidity = useRef();
    const titleIcon = useRef();

    const date = new Date();

    const arrLength = data.days.length;

    ///
    const [temperatureMinRefs, setTemperatureMinRefs] = useState([]);
    const [temperatureMaxRefs, setTemperatureMaxRefs] = useState([]);
    const [titleRefs, setTitleRefs] = useState([]);
    const [iconNames, setIconNames] = useState([]);

    const getSubscribeState = (id, cb) => {
        socket.getState(id)
            .then(result => cb(id, result));

        socket.subscribeState(id, cb);
    };

    useEffect(() => {
        setTemperatureMinRefs(_temperatureMinRefs => (
            Array(arrLength).fill().map((_, i) => _temperatureMinRefs[i] || createRef())
        ));
        setTemperatureMaxRefs(_temperatureMaxRefs => (
            Array(arrLength).fill().map((_, i) => _temperatureMaxRefs[i] || createRef())
        ));
        setTitleRefs(_titleRefs => (
            Array(arrLength).fill().map((_, i) => _titleRefs[i] || '')
        ));
        setIconNames(_iconNames => (
            Array(arrLength).fill().map((_, i) => _iconNames[i] || '')
        ));
    }, [arrLength, hideCurrent, hideDays]);

    const getIndex = (idx, callBack) => (_, state) => callBack(state, idx);

    const temperatureMinCallBack = (state, idx) => {
        if (temperatureMinRefs[idx]?.current) {
            temperatureMinRefs[idx].current.innerHTML = state?.val ? `${Math.round(state.val)}°C` : null;
        }
    };

    const temperatureMaxCallBack = (state, idx) => {
        if (temperatureMaxRefs[idx]?.current) {
            temperatureMaxRefs[idx].current.innerHTML = state?.val ? `${Math.round(state.val)}°C` : null;
        }
    };

    const titleMinCallBack = (state, idx) => {
        if (state?.val) {
            setTitleRefs(_titleRefs => _titleRefs.map((_, i) => (i === idx ? state.val : _titleRefs[i])));
        } else {
            setTitleRefs(_titleRefs => _titleRefs.map((_, i) => (i === idx ? null : _titleRefs[i])));
        }
    };

    const iconsCallBack = (state, idx) => {
        if (state?.val) {
            setIconNames(_iconNames => _iconNames.map((_, i) => (i === idx ? state.val : _iconNames[i])));
        } else {
            setIconNames(_iconNames => _iconNames.map((_, i) => (i === idx ? null : _iconNames[i])));
        }
    };

    const temperatureCallBack = (_, state) => {
        if (temperature.current) {
            temperature.current.innerHTML = state?.val ? `${Math.round(state.val)}°C` : null;
        }
    };

    const humidityCallBack = (_, state) => {
        if (humidity.current) {
            humidity.current.innerHTML = state?.val ? `${Math.round(state.val)}%` : null;
        }
    };

    useEffect(() => {
        const callBacks = [];

        if (temperatureMinRefs.length) {
            for (let i = 0; i < data.days.length; i++) {
                callBacks[i] = {
                    min:   getIndex(i, temperatureMinCallBack),
                    max:   getIndex(i, temperatureMaxCallBack),
                    state: getIndex(i, titleMinCallBack),
                    icon:  getIndex(i, iconsCallBack),
                };

                data.days[i].temperatureMin && getSubscribeState(data.days[i].temperatureMin, callBacks[i].min);
                data.days[i].temperatureMax && getSubscribeState(data.days[i].temperatureMax, callBacks[i].max);
                data.days[i].state && getSubscribeState(data.days[i].state, callBacks[i].state);
                data.days[i].icon && getSubscribeState(data.days[i].icon, callBacks[i].icon);
            }
        }

        return () => {
            if (callBacks.length) {
                for (let i = 0; i < data.days.length; i++) {
                    data.days[i].temperatureMin && socket.unsubscribeState(data.days[i].temperatureMin, callBacks[i].min);
                    data.days[i].temperatureMax && socket.unsubscribeState(data.days[i].temperatureMax, callBacks[i].max);
                    data.days[i].state && socket.unsubscribeState(data.days[i].state, callBacks[i].state);
                    data.days[i].icon && socket.unsubscribeState(data.days[i].icon, callBacks[i].icon);
                }
            }
        };
    }, [temperatureMinRefs, data]);

    // eslint-disable-next-line consistent-return
    return <div className={cls.weatherWrapper}>
        <div className={cls.wrapperBlock} style={{ display: hideCurrent ? 'none' : undefined }}>
            <div className={cls.iconWrapper}>
                <div className={Utils.clsx(cls.iconWeatherWrapper, (!arrLength || hideDays) && cls.noteArrayIcon)}>
                    <Icon className={cls.iconWeather} src={getIcon(iconName, true)} />
                </div>
                <div className={cls.styleText}>{title}</div>
            </div>
            <div>
                <div ref={temperature} className={cls.temperatureTop}>-°C</div>
                <div ref={humidity} className={cls.humidity}>-%</div>
            </div>
        </div>
        {arrLength > 0 && <div className={cls.wrapperBottomBlock} style={{ display: hideDays ? 'none' : undefined }}>
            {data.days.map((e, idx) => <div className={cls.wrapperBottomBlockCurrent} key={idx}>
                <div className={cls.date}>{I18n.t('openweathermap_' + getWeekDay(date, idx + 1))}</div>
                <div><Icon className={cls.iconWeatherMin} src={getIcon(iconNames[idx], true)} /></div>
                <div ref={temperatureMaxRefs[idx]} className={cls.temperature}>-°C</div>
                <div className={cls.temperature}>
                    <span ref={temperatureMinRefs[idx]}>-°C</span>
                </div>
            </div>)}
        </div>}
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