/**
 * @type {import('vite').UserConfig}
 */
 const config = {
    root: 'src',
    base: '',
    resolve: {
        alias: {
            'piexif-ts': 'piexif-ts/dist/piexif.js'
        }
    },
    server: {
        open: true,
    },
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        chunkSizeWarningLimit: 2048
    }
}

export default config