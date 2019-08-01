import { EventEmitter } from '@nelts/utils';
import Factory from './factory';
import { Compiler } from './compiler';
export default class Plugin<F extends Factory<Plugin<F>>> extends EventEmitter {
    private _name;
    private _cwd;
    private _app;
    private _env;
    private _source;
    private _configs;
    private _components;
    constructor(app: F, name: string, cwd: string);
    readonly logger: import("log4js").Logger;
    readonly configs: any;
    readonly app: F;
    readonly name: string;
    readonly cwd: string;
    readonly env: string;
    readonly source: string;
    private _findSource;
    addCompiler<T extends Plugin<F>>(compiler: Compiler<T>): this;
    setComponent(...deps: string[]): void;
    props<T = any>(configs: T): Promise<void>;
    getComponent<T extends Plugin<F>>(name: string): T;
    broadcast(name: string, ...args: any[]): Promise<void>;
}
