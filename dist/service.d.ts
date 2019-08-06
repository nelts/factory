import Plugin from './plugin';
import Factory from './factory';
export default function Service<T extends Plugin<Factory<T>>>(plugin: T): Promise<void>;
