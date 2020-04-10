import { constantCase } from 'constant-case';
import { JSONPath } from 'jsonpath-plus';

export interface PropertySource<T> {
    readonly name: string;
    readonly source: T;
    has (key: string): boolean;
    get (key: string): unknown | undefined;
}

export interface EnumerablePropertySource<T> extends PropertySource<T> {

    keys (): Iterable<string>;
}

export class MapPropertySource<T = unknown> implements EnumerablePropertySource<Map<string, T>> {

    constructor (readonly name: string, readonly source: Map<string, T>) { }

    keys (): Iterable<string> {
        return this.source.keys();
    }

    has (key: string): boolean {
        return this.source.has(key);
    }

    get (key: string): T {
        return this.source.get(key) as T;
    }
}

export interface KVSource<T = boolean | number | string | KVSource<any>> {
    [ key: string ]: T | undefined;
}

export class ObjectPropertySource implements PropertySource<KVSource<string | KVSource>> {
    constructor (readonly name: string, readonly source: KVSource<string | KVSource>) {

    }
    has (key: string): boolean {
        const res = JSONPath({ path: key, json: this.source, wrap: false });
        return res !== undefined;
    }
    get (key: string): unknown {
        return JSONPath({ path: key, json: this.source, wrap: false });
    }

}

export class ProcessEnvironmentPropertySource implements PropertySource<KVSource<string>> {
    constructor (readonly name: string, readonly source: KVSource<string>) {
    }
    has (key: string): boolean {
        return this.source[ constantCase(key) ] !== undefined;
    }
    get (key: string): unknown {
        return this.source[ constantCase(key) ];
    }
}
