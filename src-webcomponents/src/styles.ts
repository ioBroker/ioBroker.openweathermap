/**
 * The styles of the shadow root. The element fills the box of the host; it has a transparent background and
 * inherits `color` and `font`, so it follows the theme of the host. Secondary text, the focus ring and the lines
 * take the theme variables of the host (`--iob-*`); the weather icons are the coloured ones of the vis-2 widget.
 *
 * The sizes follow the box through container units (`cqmin`, and `cqw` where six days must fit side by side). Each
 * layout sets them as variables: `--now-icon`, `--fs-temp`, `--fs-text`, `--fs-day` and `--day-icon`. A wide and
 * low box puts the current weather beside the days instead of above them.
 */
export const STYLES = `
:host {
    display: block;
    width: 100%;
    height: 100%;
}
.mount {
    width: 100%;
    height: 100%;
    /* the size of the box does not depend on what is in it - no loop between measuring and laying out */
    container-type: size;
}
.weather {
    --pad: clamp(4px, 3cqmin, 12px);
    --gap: clamp(2px, 2.5cqmin, 10px);
    --marker: clamp(12px, 7cqmin, 22px);
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: var(--pad);
    display: flex;
    flex-direction: column;
    gap: var(--gap);
    overflow: hidden;
    line-height: 1.25;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
    border-radius: calc(var(--iob-border-radius) * 2);
    outline: none;
}
.weather:focus-visible {
    box-shadow: inset 0 0 0 2px var(--iob-primary);
}
.weather.edit {
    cursor: default;
    pointer-events: none;
}
.title {
    flex: none;
    font-weight: 600;
    font-size: clamp(11px, 7cqmin, 20px);
    color: var(--iob-text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: var(--marker);
}
.body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--gap);
}
.now {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gap);
    min-width: 0;
}
.weather:not(.titled) .now {
    padding-right: var(--marker);
}
.now-main {
    display: flex;
    align-items: center;
    gap: var(--gap);
    min-width: 0;
}
.now-icon {
    flex: none;
    width: var(--now-icon);
    height: var(--now-icon);
}
.now-text {
    min-width: 0;
    font-size: var(--fs-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.now-values {
    flex: none;
    text-align: right;
}
.now-temp {
    font-size: var(--fs-temp);
    line-height: 1.1;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}
.now-humidity {
    font-size: var(--fs-text);
    color: var(--iob-text-secondary);
    font-variant-numeric: tabular-nums;
}
.days {
    display: flex;
    min-height: 0;
}
.day {
    flex: 1 1 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: calc(var(--gap) / 2);
    font-size: var(--fs-day);
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
}
.dow,
.min {
    color: var(--iob-text-secondary);
}
.day-icon {
    flex: none;
    width: var(--day-icon);
    height: var(--day-icon);
}
img {
    display: block;
    object-fit: contain;
}
.marker {
    position: absolute;
    top: var(--pad);
    right: var(--pad);
    width: var(--marker);
    height: var(--marker);
    fill: currentColor;
    opacity: 0.4;
}
.weather:hover .marker {
    opacity: 0.8;
}
.weather.edit .marker {
    opacity: 0.25;
}

/* the current weather above the days */
.layout-all {
    --now-icon: clamp(24px, 32cqmin, 140px);
    --fs-temp: clamp(14px, 15cqmin, 56px);
    --fs-text: clamp(10px, 6cqmin, 22px);
    --fs-day: clamp(8px, min(6.5cqmin, 4.2cqw), 18px);
    --day-icon: clamp(14px, min(14cqmin, 10cqw), 60px);
}
/* only the current weather: big and centred */
.layout-current {
    --now-icon: clamp(28px, 50cqmin, 260px);
    --fs-temp: clamp(16px, 20cqmin, 96px);
    --fs-text: clamp(10px, 8cqmin, 28px);
}
.layout-current .body {
    justify-content: center;
}
/* only the days: they take the whole box */
.layout-days {
    --fs-day: clamp(9px, min(9cqmin, 4.5cqw), 24px);
    --day-icon: clamp(16px, min(28cqmin, 12cqw), 120px);
}
.layout-days .body {
    justify-content: center;
}
.layout-days:not(.titled) .days {
    padding-right: var(--marker);
}
/* a wide and low box: the current weather beside the days */
@container (min-aspect-ratio: 12/5) {
    .layout-all {
        --now-icon: clamp(24px, 55cqh, 160px);
        --fs-temp: clamp(14px, 22cqh, 56px);
        --fs-text: clamp(10px, 10cqh, 22px);
        --fs-day: clamp(8px, min(11cqh, 2.6cqw), 18px);
        --day-icon: clamp(14px, min(26cqh, 6cqw), 60px);
    }
    .layout-all .body {
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
    }
    .layout-all .now {
        flex: 0 1 auto;
        max-width: 45%;
    }
    .weather.layout-all:not(.titled) .now {
        padding-right: 0;
    }
    .layout-all .days {
        flex: 1 1 auto;
    }
    .layout-all:not(.titled) .days {
        padding-right: var(--marker);
    }
}
.hint {
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    padding: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    text-align: center;
    color: var(--iob-text-secondary);
    font-size: clamp(11px, 6cqmin, 15px);
}
.hint svg {
    width: clamp(18px, 14cqmin, 40px);
    height: clamp(18px, 14cqmin, 40px);
    fill: currentColor;
    opacity: 0.7;
}
`;

/**
 * The styles of the details in the dialog of the host. The host moves the element into its dialog, so the theme
 * variables are set on that element itself (`index.tsx`).
 */
export const DETAILS_STYLES = `
:host {
    display: block;
}
.details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--iob-text);
    font-family: var(--iob-font-family);
    font-size: var(--iob-font-size);
    line-height: 1.4;
}
.card {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 12px;
    border: 1px solid var(--iob-divider);
    border-radius: calc(var(--iob-border-radius) * 2);
    min-width: 0;
}
.head {
    font-weight: 600;
}
.sub {
    font-weight: normal;
    color: var(--iob-text-secondary);
}
.now-row {
    display: flex;
    align-items: center;
    gap: 16px;
}
img,
.big,
.icon {
    display: block;
    object-fit: contain;
}
.big {
    flex: none;
    width: 96px;
    height: 96px;
}
.temp {
    font-size: 2.2em;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
}
.desc {
    color: var(--iob-text-secondary);
}
.minmax {
    font-variant-numeric: tabular-nums;
}
.minmax .max {
    font-weight: 600;
}
dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 12px;
    margin: 0;
}
dt {
    color: var(--iob-text-secondary);
}
dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
}
.days {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
}
.day {
    align-items: center;
    text-align: center;
}
.day dl {
    align-self: stretch;
    text-align: left;
}
.icon {
    width: 56px;
    height: 56px;
}
`;
