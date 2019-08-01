export type Compiler<P> = (plugin: P) => Promise<any>;

export default class Loader<P> {
  private plugins: P[] = [];
  private compilers: Compiler<P>[] = [];

  addPlugin(plugin: P) {
    this.plugins.push(plugin);
    return this;
  }

  addCompiler(compiler: Compiler<P>) {
    this.compilers.push(compiler);
    return this;
  }

  async run() {
    for (let i = 0; i < this.plugins.length; i++) {
      const plugin = this.plugins[i];
      for (let j = 0; j < this.compilers.length; j++) {
        const compiler = this.compilers[j];
        await compiler(plugin);
      }
    }
  }
}