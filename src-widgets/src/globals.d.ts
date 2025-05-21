declare global {
    declare module '*.svg';
    declare module '*.png';
    declare module '*.jpg';
    declare module '*.scss';

    declare module '@mui/material/Button' {
        interface ButtonPropsColorOverrides {
            grey: true;
        }
    }
}

export {};
