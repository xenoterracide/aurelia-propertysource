import { constantCase } from 'constant-case';
import { JSONPath } from 'jsonpath-plus';

interface Getter<K, T> {
    has(key: K): boolean;
    get(key: string): T;
}

export interface PropertySource<T = unknown> extends Getter<string, unknown | undefined> {
    readonly name: string;
    readonly source: T;
}

export interface EnumerablePropertySource<T> extends PropertySource<T> {
    keys(): Iterable<string>;
}

export class MapPropertySource<T = unknown> implements EnumerablePropertySource<Map<string, T>> {
    constructor(readonly name: string, readonly source: Map<string, T>) {}

    keys(): Iterable<string> {
        return this.source.keys();
    }

    has(key: string): boolean {
        return this.source.has(key);
    }

    get(key: string): T {
        return this.source.get(key) as T;
    }
}

export interface KVSource<T = boolean | number | string | KVSource<unknown>> {
    [key: string]: T | undefined;
}

export interface PropertySources extends Getter<string, PropertySource>, Iterable<PropertySource> {}

export class ImmutablePropertySources implements PropertySources {
    readonly #map: Map<string, PropertySource>;
    readonly #list: Array<PropertySource>;

    constructor(propertySources: PropertySource[]) {
        this.#map = new Map(propertySources.map((ps) => [ps.name, ps]));
        this.#list = propertySources;
    }
    [Symbol.iterator](): Iterator<PropertySource<unknown>, unknown, undefined> {
        return this.#list[Symbol.iterator]();
    }

    has(key: string): boolean {
        return this.#map.has(key);
    }
    get(key: string): PropertySource<unknown> {
        return this.get(key);
    }
}

export class ObjectPropertySource implements PropertySource<KVSource<string | KVSource>> {
    constructor(readonly name: string, readonly source: KVSource<string | KVSource>) {}
    has(key: string): boolean {
        const res = JSONPath({ path: key, json: this.source, wrap: false });
        return res !== undefined;
    }
    get(key: string): unknown {
        return JSONPath({ path: key, json: this.source, wrap: false });
    }
}

export class ProcessEnvironmentPropertySource implements PropertySource<KVSource<string>> {
    constructor(readonly name: string, readonly source: KVSource<string>) {}
    has(key: string): boolean {
        return this.source[constantCase(key)] !== undefined;
    }
    get(key: string): unknown {
        return this.source[constantCase(key)];
    }
}
