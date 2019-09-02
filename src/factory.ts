import * as path from 'path';
import { Component, Processer, ProcessArgvType, WidgetComponent, CHILD_PROCESS_TYPE } from '@nelts/process';
import Compiler from './compiler';
import { RequireDefault, findNodeModules, Collect } from '@nelts/utils';
import Plugin from './plugin';
import { Container } from 'injection';
import ServiceCompiler from './service';

export interface InCommingMessage extends ProcessArgvType {
  base: string,
  env: string,
  config?: string,
  cwd: string,
  script: string,
  kind: number,
  [name: string]: any,
}

export default class Factory<P extends Plugin<Factory<P>>> extends Component implements WidgetComponent {
  private _base: string;
  private _env: string;
  private _inCommingMessage: InCommingMessage;
  private _configs: any = {};
  private _plugins: { [name: string]: P } = {};
  private _structor: { new(t: Factory<P>, n: string, m: string): P };
  private _root: P;
  private _injector: Container = new Container();
  public dispatch: (component_path: string, root?: P) => Promise<P>;
  public readonly compiler = new Compiler<P>();

  constructor(processer: Processer, args: InCommingMessage, PluginConstructor: { new(t: Factory<P>, n: string, m: string): P }) {
    super(processer, args);
    this._base = args.base ? path.resolve(args.base || '.') : (args.cwd || process.cwd());
    this._env = args.env;
    this._inCommingMessage = args;
    this._structor = PluginConstructor;
    if (this._inCommingMessage.config) this._configs = RequireDefault(this._inCommingMessage.config, this._base);
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

  set configs(value: any) {
    this._configs = value;
  }

  async componentWillCreate() {
    this.dispatch = this.render();
    this._root = await this.dispatch(this.base);
    this.compiler.addCompiler(ServiceCompiler);
  }

  async componentDidCreated() {
    await this.compiler.run();
    if (this.configs) {
      if (typeof this.configs === 'function') {
        this.configs = await this.configs(this);
      }
      this.configs = Object.freeze(this.configs);
      await this._root.props(this.configs);
    }
  }

  componentCatchError(err: Error) {
    this.logger.error(err);
  }

  private getEnvName() {
    switch (this.kind) {
      case CHILD_PROCESS_TYPE.AGENT: return 'agent';
      case CHILD_PROCESS_TYPE.MASTER: return 'master';
      case CHILD_PROCESS_TYPE.WORKER: return 'worker';
      default: return 'unknow';
    }
  }

  render() {
    const node_module_paths = findNodeModules({ cwd: this.base, relative: false });
    if (!node_module_paths.length) throw new Error('cannot find node_modules path');
    const node_module_path = node_module_paths[0];
    const dispatch = async (component_path: string, root?: P) => {
      const { name, dependenties } = Collect(component_path, node_module_path, { env: this.env, name: this.getEnvName() });
      if (!this.plugins[name]) this.plugins[name] = new this._structor(this, name, component_path);
      if (!root) root = this.plugins[name];
      const childrens = await Promise.all(dependenties.map(dep => dispatch(dep, root)));
      this.plugins[name].setComponent(...childrens.map(child => child.name));
      this.compiler.addPlugin(this.plugins[name]);
      return this.plugins[name];
    }
    return dispatch;
  }
}