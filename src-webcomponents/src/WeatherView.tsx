import { useState, type JSX, type KeyboardEvent } from 'react';

/** A labelled value of the details: `Wind` - `NNE 3 m/s` */
export interface Fact {
    label: string;
    value: string;
}

/** The current weather, as text ready to show */
export interface CurrentValues {
    /** The date of today, long */
    date: string;
    icon: string | null;
    /** The group of the weather (`Clouds`), translated */
    titleText: string;
    /** The description of OpenWeatherMap (`light rain`), in the language of the instance */
    description: string;
    /** With the unit, `--` without a value */
    temperature: string;
    /** With `%`, `--` without a value */
    humidity: string;
    /** With the unit, empty without a value */
    max: string;
    min: string;
    facts: Fact[];
}

/** A day of the forecast, as text ready to show */
export interface DayValues {
    /** `Mon` of the vis-2 widget */
    weekday: string;
    /** The date, short */
    date: string;
    icon: string | null;
    titleText: string;
    /** With the unit, `--` without a value */
    max: string;
    min: string;
    facts: Fact[];
}

export interface WeatherValues {
    current: CurrentValues;
    days: DayValues[];
}

/** `InfoOutlined` of the Material icons */
const INFO_PATH =
    'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8';
/** `CloudOutlined` of the Material icons */
const CLOUD_PATH =
    'M12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6m0-2C9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96C18.67 6.59 15.64 4 12 4';

function SvgIcon({ path, className }: { path: string; className?: string }): JSX.Element {
    return (
        <svg
            className={className}
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <path d={path} />
        </svg>
    );
}

/** A weather icon; an empty box of the same size while there is none or it cannot be loaded */
function WeatherIcon({ url, className, alt }: { url: string | null; className: string; alt?: string }): JSX.Element {
    const [failed, setFailed] = useState('');
    if (!url || failed === url) {
        return <span className={className} />;
    }
    return (
        <img
            className={className}
            src={url}
            alt={alt || ''}
            draggable={false}
            referrerPolicy="no-referrer"
            onError={() => setFailed(url)}
        />
    );
}

/** A hint instead of the weather: no instance chosen, or it has no data */
export function Hint({ text }: { text: string }): JSX.Element {
    return (
        <div className="hint">
            <SvgIcon path={CLOUD_PATH} />
            <span>{text}</span>
        </div>
    );
}

export interface WeatherViewProps {
    values: WeatherValues;
    /** `all`, `current` or `days` */
    type: string;
    title: string;
    editMode: boolean;
    /** The word for the details, as tooltip */
    detailsLabel: string;
    onDetails: () => void;
}

/**
 * The tile: the current weather above the forecast days, like the vis-2 widget. A click or Enter shows the details.
 * The sizes follow the box of the host (container units, see `styles.ts`).
 */
export function WeatherView({ values, type, title, editMode, detailsLabel, onDetails }: WeatherViewProps): JSX.Element {
    const showCurrent = type !== 'days';
    const showDays = type !== 'current' && values.days.length > 0;
    const layout = showCurrent && showDays ? 'all' : showCurrent ? 'current' : 'days';
    const { current } = values;

    return (
        <div
            className={`weather layout-${layout}${title ? ' titled' : ''}${editMode ? ' edit' : ''}`}
            role={editMode ? undefined : 'button'}
            tabIndex={editMode ? undefined : 0}
            title={editMode ? undefined : detailsLabel}
            aria-label={editMode ? undefined : `${title || current.titleText} - ${detailsLabel}`}
            onClick={editMode ? undefined : onDetails}
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                if (!editMode && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onDetails();
                }
            }}
        >
            {title ? <div className="title">{title}</div> : null}
            <div className="body">
                {showCurrent ? (
                    <div className="now">
                        <div className="now-main">
                            <WeatherIcon
                                className="now-icon"
                                url={current.icon}
                                alt={current.titleText}
                            />
                            <div className="now-text">{current.titleText}</div>
                        </div>
                        <div className="now-values">
                            <div className="now-temp">{current.temperature}</div>
                            <div className="now-humidity">{current.humidity}</div>
                        </div>
                    </div>
                ) : null}
                {showDays ? (
                    <div className="days">
                        {values.days.map((day, i) => (
                            <div
                                className="day"
                                key={i}
                            >
                                <div className="dow">{day.weekday}</div>
                                <WeatherIcon
                                    className="day-icon"
                                    url={day.icon}
                                    alt={day.titleText}
                                />
                                <div className="max">{day.max}</div>
                                <div className="min">{day.min}</div>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
            <SvgIcon
                className="marker"
                path={INFO_PATH}
            />
        </div>
    );
}

function Facts({ facts }: { facts: Fact[] }): JSX.Element | null {
    if (!facts.length) {
        return null;
    }
    return (
        <dl>
            {facts.map(fact => [<dt key={`${fact.label}-l`}>{fact.label}</dt>, <dd key={fact.label}>{fact.value}</dd>])}
        </dl>
    );
}

function MinMax({ max, min }: { max: string; min: string }): JSX.Element | null {
    if (!max && !min) {
        return null;
    }
    return (
        <div className="minmax">
            <span className="max">{max || '--'}</span>
            {' / '}
            <span>{min || '--'}</span>
        </div>
    );
}

/** The content of the details dialog: today with wind, humidity, pressure and precipitation, then the days */
export function WeatherDetails({ values }: { values: WeatherValues }): JSX.Element {
    const { current } = values;
    return (
        <div className="details">
            <section className="card now">
                <div className="head">{current.date}</div>
                <div className="now-row">
                    <WeatherIcon
                        className="big"
                        url={current.icon}
                        alt={current.titleText}
                    />
                    <div>
                        <div className="temp">{current.temperature}</div>
                        <MinMax
                            max={current.max}
                            min={current.min}
                        />
                        <div className="desc">{current.description || current.titleText}</div>
                    </div>
                </div>
                <Facts facts={current.facts} />
            </section>
            {values.days.length ? (
                <div className="days">
                    {values.days.map((day, i) => (
                        <section
                            className="card day"
                            key={i}
                        >
                            <div className="head">
                                {day.weekday} <span className="sub">{day.date}</span>
                            </div>
                            <WeatherIcon
                                className="icon"
                                url={day.icon}
                                alt={day.titleText}
                            />
                            <div className="desc">{day.titleText}</div>
                            <MinMax
                                max={day.max === '--' ? '' : day.max}
                                min={day.min === '--' ? '' : day.min}
                            />
                            <Facts facts={day.facts} />
                        </section>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
