import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from '@nelts/utils';
import Factory from './factory';
import { Require, NELTS_PACKAGE_JSON_INTERFACE } from '@nelts/utils';
import { Compiler } from './compiler';
export default class Plugin<F extends Factory<Plugin<F>>> extends EventEmitter {
  private _name: string;
  private _cwd: string;
  private _app: F;
  private _env: string;
  private _source: string;
  private _configs: any;
  private _components: string[] = [];
  constructor(app: F, name: string, cwd: string) {
    super();
    this._app = app;
    this._name = name;
    this._cwd = cwd;
    this._env = app.env;
    this._source = this._findSource(cwd);
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

  private _findSource(cwd: string) {
    const packageFilePath = path.resolve(cwd, 'package.json');
    if (!fs.existsSync(packageFilePath)) return cwd;
    const packageExports = Require<NELTS_PACKAGE_JSON_INTERFACE>(packageFilePath);
    if (!packageExports.source) return cwd;
    return path.resolve(cwd, packageExports.source);
  }

  addCompiler<T extends Plugin<F>>(compiler: Compiler<T>) {
    this._app.compiler.addCompiler(compiler);
    return this;
  }

  setComponent(...deps: string[]) {
    deps.forEach(dep => {
      if (this._components.indexOf(dep) === -1) {
        this._components.push(dep);
      }
    });
  }

  async props<T = any>(configs: T) {
    this._configs = typeof configs === 'object' 
      ? Object.freeze(configs) 
      : configs;
    await this.emit('props', this._configs);
  }

  getComponent<T extends Plugin<F>>(name: string) {
    if (this._components.indexOf(name) === -1) throw new Error(`${name} is not depended on ${this.name}`);
    return <T>this._app.plugins[name];
  }

  async broadcast(name: string, ...args: any[]) {
    await this.emit(name, ...args);
    for (let i = 0; i < this._components.length; i++) {
      const componentName = this._components[i];
      const plugin = this._app.plugins[componentName];
      if (plugin) await plugin.broadcast(name, ...args);
    }
  }
}