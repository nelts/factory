"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const process_1 = require("@nelts/process");
const compiler_1 = require("./compiler");
const utils_1 = require("@nelts/utils");
const injection_1 = require("injection");
const service_1 = require("./service");
class Factory extends process_1.Component {
    constructor(processer, args, PluginConstructor) {
        super(processer, args);
        this._configs = {};
        this._plugins = {};
        this._injector = new injection_1.Container();
        this._gettingConfigs = false;
        this.compiler = new compiler_1.default();
        this._base = args.base ? path.resolve(args.base || '.') : (args.cwd || process.cwd());
        this._env = this.processer.env;
        this._inCommingMessage = args;
        this._structor = PluginConstructor;
        if (this._inCommingMessage.config)
            this._configs = utils_1.RequireDefault(this._inCommingMessage.config, this._base);
        this.getConfigsDynamic();
    }
    getConfigsDynamic() {
        if (typeof this.configs === 'function') {
            this._gettingConfigs = true;
            Promise.resolve(this.configs(this))
                .then(data => this.configs = data)
                .catch(e => this.logger.fatal(e))
                .finally(() => this._gettingConfigs = false);
        }
    }
    waitGetConfigs() {
        return new Promise((resolve, reject) => {
            if (!this._gettingConfigs)
                return resolve();
            const time = Date.now();
            const timer = setInterval(() => {
                if (Date.now() - time > 90000) {
                    clearInterval(timer);
                    return reject(new Error('get configs timeout: 90000'));
                }
                if (this._gettingConfigs)
                    return;
                clearInterval(timer);
                resolve();
            }, 10);
        });
    }
    get injector() {
        return this._injector;
    }
    get inCommingMessage() {
        return this._inCommingMessage;
    }
    get logger() {
        return this.processer.logger;
    }
    get base() {
        return this._base;
    }
    get env() {
        return this._env;
    }
    get plugins() {
        return this._plugins;
    }
    get configs() {
        return this._configs;
    }
    set configs(value) {
        this._configs = value;
    }
    async componentWillCreate() {
        await this.waitGetConfigs();
        this.dispatch = this.render();
        this._root = await this.dispatch(this.base);
        this.compiler.addCompiler(service_1.default);
    }
    async componentDidCreated() {
        await this.compiler.run();
        if (this.configs) {
            this.configs = Object.freeze(this.configs);
            await this._root.props(this.configs);
        }
    }
    componentCatchError(err) {
        this.logger.error(err);
    }
    getEnvName() {
        switch (this.kind) {
            case process_1.CHILD_PROCESS_TYPE.AGENT: return 'agent';
            case process_1.CHILD_PROCESS_TYPE.MASTER: return 'master';
            case process_1.CHILD_PROCESS_TYPE.WORKER: return 'worker';
            default: return 'unknow';
        }
    }
    render() {
        const node_module_paths = utils_1.findNodeModules({ cwd: this.base, relative: false });
        if (!node_module_paths.length)
            throw new Error('cannot find node_modules path');
        const node_module_path = node_module_paths[0];
        const dispatch = async (component_path, root) => {
            const { name, dependenties } = utils_1.Collect(component_path, node_module_path, { env: this.env, name: this.getEnvName() });
            if (!this.plugins[name])
                this.plugins[name] = new this._structor(this, name, component_path);
            if (!root)
                root = this.plugins[name];
            const childrens = await Promise.all(dependenties.map(dep => dispatch(dep, root)));
            this.plugins[name].setComponent(...childrens.map(child => child.name));
            this.compiler.addPlugin(this.plugins[name]);
            return this.plugins[name];
        };
        return dispatch;
    }
}
exports.default = Factory;
