"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const globby = require("globby");
const utils_1 = require("@nelts/utils");
async function Service(plugin) {
    const cwd = plugin.source;
    const files = await globby([
        'service/**/*.ts',
        'service/**/*.js',
        '!service/**/*.d.ts',
    ], { cwd });
    files.forEach((file) => {
        file = path.resolve(cwd, file);
        plugin.app.injector.bind(utils_1.RequireDefault(file));
    });
}
exports.default = Service;
