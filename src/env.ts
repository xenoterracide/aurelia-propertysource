import { constantCase } from 'constant-case';
import { JSONPath } from 'jsonpath-plus';
import { DI } from '@aurelia/kernel';

export const RequiredProperties = DI.createInterface<Array<string>>('RequiredProperties').noDefault();
export const Environment = DI.createInterface<Environment>('Environment').noDefault();

export interface PropertySourceLoader {
    load(key: string): PropertySource;
}

interface Getter<K, T> {
    has(key: K): boolean;
    get(key: string): T;
}

export interface Environment extends PropertyResolver {
    getActiveProfiles(): Profiles[];
    acceptsProfiles(profiles: Profiles): boolean;
}

export interface Profiles {
    matches(activeProfiles: (profile: string) => boolean): boolean;
}

export interface PropertyResolver {
    has(key: string): boolean;
    get(key: string): unknown | undefined;
    get<T>(key: string): T | undefined;
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

export class StandardEnvironment implements Environment {
    readonly #propertySources: PropertySources;
    constructor(propertySources: PropertySources) {
        this.#propertySources = propertySources;
    }
    has(key: string): boolean {
        return this.#propertySources.some((ps) => ps.has(key));
    }
    get<T = unknown>(key: string): T | unknown | undefined {
        return this.#propertySources.find((ps) => ps.has(key))?.get(key);
    }
    getActiveProfiles(): Profiles[] {
        throw new Error('Method not implemented.');
    }
    acceptsProfiles(profiles: Profiles): boolean {
        throw new Error('Method not implemented.');
    }
}

export class ImmutablePropertySources extends Array<PropertySource> implements PropertySources {
    readonly #map: Map<string, PropertySource>;
    constructor(...propertySources: PropertySource[]) {
        super();
        this.push(...propertySources);
        this.#map = new Map(propertySources.map((ps) => [ps.name, ps]));
        if (this.length !== this.#map.size) {
            throw new Error(`you should not have duplicate named property sources ${this.map((p) => p.name)}`);
        }
    }

    has(key: string): boolean {
        return this.#map.has(key);
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

export class ObjectPropertySource implements PropertySource<KVSource> {
    constructor(readonly name: string, readonly source: KVSource) {}
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
