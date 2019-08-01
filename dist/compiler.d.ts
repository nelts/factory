export declare type Compiler<P> = (plugin: P) => Promise<any>;
export default class Loader<P> {
    private plugins;
    private compilers;
    addPlugin(plugin: P): this;
    addCompiler(compiler: Compiler<P>): this;
    run(): Promise<void>;
}
