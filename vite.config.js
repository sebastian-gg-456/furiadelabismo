import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    base: './',
    publicDir: path.resolve(__dirname, 'public'),
    server: {
        port: 3000,
        strictPort: true,
        fs: {
            strict: false,
            allow: ['..']
        }
    },
    build: {
        assetsDir: 'assets'
    },
    resolve: {
        alias: {
            '@public': path.resolve(__dirname, 'public')
        }
    }
});