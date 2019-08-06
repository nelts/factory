import * as path from 'path';
import * as globby from 'globby';
import Plugin from './plugin';
import Factory from './factory';
import { RequireDefault } from '@nelts/utils';
export default async function Service<T extends Plugin<Factory<T>>>(plugin: T) {
  const cwd = plugin.source;
  const files = await globby([
    'service/**/*.ts', 
    'service/**/*.js', 
    '!service/**/*.d.ts', 
  ], { cwd });
  files.forEach((file: string) => {
    file = path.resolve(cwd, file);
    plugin.app.injector.bind(RequireDefault(file));
  });
}