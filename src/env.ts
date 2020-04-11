import { constantCase } from 'constant-case';
import { JSONPath } from 'jsonpath-plus';
import { DI, optional } from '@aurelia/kernel';

export const RequiredProperties = DI.createInterface<Array<string>>('RequiredProperties').noDefault();

interface Getter<K, T> {
    has(key: K): boolean;
    get(key: string): T;
}

export interface PropertyResolver {
    has(key: string): boolean;
    get(key: string): unknown | undefined;
    get<T>(key: string): T | undefined;
    get<T>(key: string, defaultvalue: T): T;

    getRequired(key: string): unknown;
    getRequired<T>(key: string): T;
    getRequired<T>(key: string, defaultvalue: T): T;
}

export interface PropertySource<T = unknown> extends Getter<string, unknown | undefined> {
    readonly name: string;
    readonly source: T;
}

export interface EnumerablePropertySource<T> extends PropertySource<T> {
    keys(): Iterable<string>;
}

export interface KVSource<T = boolean | number | string | KVSource<unknown>> {
    [key: string]: T | undefined;
}

export interface PropertySources extends Getter<string, PropertySource>, Array<PropertySource> {}

export class PropertySourcesPropertyResolver implements PropertyResolver {
    readonly #propertySources: PropertySources;
    readonly #requiredProperites: string[];
    constructor(propertySources: PropertySources, @optional(RequiredProperties) requiredProperties?: string[]) {
        this.#propertySources = propertySources;
        this.#requiredProperites = requiredProperties ?? [];
    }
    has(key: string): boolean {
        return this.#propertySources.some((ps) => ps.has(key));
    }
    get<T = unknown>(key: string, defaultvalue?: T): T | unknown | undefined {
        return this.#propertySources.find((ps) => ps.has(key))?.get(key) ?? defaultvalue;
    }
    getRequired<T>(key: any, defaultvalue?: any): T | unknown | undefined {
        const val = this.get(key, defaultvalue);
        if (val === undefined) {
            throw new Error(`value for ${key} not found`);
        }
        return val;
    }
}

export class ImmutablePropertySources extends Array<PropertySource> implements PropertySources {
    private readonly myMap: Map<string, PropertySource>;
    constructor(ps: PropertySource, ...propertySources: PropertySource[]) {
        super();
        this.push(ps, ...propertySources);
        this.myMap = new Map(propertySources.map((ps) => [ps.name, ps]));
        if (this.length !== this.myMap.size) {
            throw new Error(`you should not have duplicate named property sources ${this.map((p) => p.name)}`);
        }
    }

    has(key: string): boolean {
        return this.myMap.has(key);
    }
    get(key: string): PropertySource<unknown> {
        return this.get(key);
    }
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
