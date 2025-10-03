"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = require("path");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)()],
    root: 'frontend',
    build: {
        outDir: '../dist/frontend',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: (0, path_1.resolve)(__dirname, 'frontend/index.html'),
            },
        },
    },
    server: {
        port: 3000,
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    resolve: {
        alias: {
            '@': (0, path_1.resolve)(__dirname, 'frontend/src'),
            '@components': (0, path_1.resolve)(__dirname, 'frontend/src/components'),
            '@hooks': (0, path_1.resolve)(__dirname, 'frontend/src/hooks'),
            '@utils': (0, path_1.resolve)(__dirname, 'frontend/src/utils'),
            '@types': (0, path_1.resolve)(__dirname, 'frontend/src/types'),
            '@services': (0, path_1.resolve)(__dirname, 'frontend/src/services'),
        },
    },
});
//# sourceMappingURL=vite.config.js.map