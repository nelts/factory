import { Component, Processer, ProcessArgvType, WidgetComponent } from '@nelts/process';
import Compiler from './compiler';
import Plugin from './plugin';
import { Container } from 'injection';
export interface InCommingMessage extends ProcessArgvType {
    base: string;
    env: string;
    config?: string;
    cwd: string;
    script: string;
    kind: number;
    [name: string]: any;
}
export default class Factory<P extends Plugin<Factory<P>>> extends Component implements WidgetComponent {
    private _base;
    private _env;
    private _inCommingMessage;
    private _configs;
    private _plugins;
    private _structor;
    private _root;
    private _injector;
    dispatch: (component_path: string, root?: P) => Promise<P>;
    readonly compiler: Compiler<P>;
    constructor(processer: Processer, args: InCommingMessage, PluginConstructor: {
        new (t: Factory<P>, n: string, m: string): P;
    });
    readonly injector: Container;
    readonly inCommingMessage: InCommingMessage;
    readonly logger: import("log4js").Logger;
    readonly base: string;
    readonly env: string;
    readonly plugins: {
        [name: string]: P;
    };
    readonly configs: any;
    componentWillCreate(): Promise<void>;
    componentDidCreated(): Promise<void>;
    componentCatchError(err: Error): void;
    render(): (component_path: string, root?: P) => Promise<P>;
}
