/** An SVG file as its text: `import svg from './icon.svg?raw'` (Vite) */
declare module '*.svg?raw' {
    const svg: string;
    export default svg;
}
