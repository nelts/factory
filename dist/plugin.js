"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const utils_1 = require("@nelts/utils");
const utils_2 = require("@nelts/utils");
class Plugin extends utils_1.EventEmitter {
    constructor(app, name, cwd) {
        super();
        this._components = [];
        this._app = app;
        this._name = name;
        this._cwd = cwd;
        this._env = app.env;
        this._source = this._findSource(cwd);
    }
    get injector() {
        return this.app.injector;
    }
    get logger() {
        return this.app.logger;
    }
    get configs() {
        return this._configs;
    }
    get app() {
        return this._app;
    }
    get name() {
        return this._name;
    }
    get cwd() {
        return this._cwd;
    }
    get env() {
        return this._env;
    }
    get source() {
        return this._source;
    }
    _findSource(cwd) {
        const packageFilePath = path.resolve(cwd, 'package.json');
        if (!fs.existsSync(packageFilePath))
            return cwd;
        const packageExports = utils_2.Require(packageFilePath);
        if (!packageExports.source)
            return cwd;
        return path.resolve(cwd, packageExports.source);
    }
    addCompiler(compiler) {
        this._app.compiler.addCompiler(compiler);
        return this;
    }
    setComponent(...deps) {
        deps.forEach(dep => {
            if (this._components.indexOf(dep) === -1) {
                this._components.push(dep);
            }
        });
    }
    async props(configs) {
        this._configs = typeof configs === 'object'
            ? Object.freeze(configs)
            : configs;
        await this.emit('props', this._configs);
    }
    getComponent(name) {
        if (this._components.indexOf(name) === -1)
            throw new Error(`${name} is not depended on ${this.name}`);
        return this._app.plugins[name];
    }
    async broadcast(name, ...args) {
        await this.emit(name, ...args);
        for (let i = 0; i < this._components.length; i++) {
            const componentName = this._components[i];
            const plugin = this._app.plugins[componentName];
            if (plugin)
                await plugin.broadcast(name, ...args);
        }
    }
}
exports.default = Plugin;
