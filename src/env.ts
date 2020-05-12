import { constantCase } from 'constant-case';
import { readFile } from 'fs';
import { JSONPath } from 'jsonpath-plus';
import { DI } from '@aurelia/kernel';
import { value } from './di';

export const RequiredProperties = DI.createInterface<Array<string>>(
  'RequiredProperties'
).noDefault();
export const Environment = DI.createInterface<Environment>(
  'Environment'
).noDefault();

export interface Environment extends PropertyResolver {
  getActiveProfiles(): Profiles[];
  acceptsProfiles(profiles: Profiles): boolean;
}

export interface Profiles {
  matches(activeProfiles: (profile: string) => boolean): boolean;
}

export interface PropertyResolver {
  has(key: string): Promise<boolean>;
  get(key: string): Promise<unknown | undefined>;
  get<T>(key: string): Promise<T | undefined>;
}

export interface PropertySource<T = unknown> {
  readonly name: string;
  readonly source: T;

  load(): Promise<void>;
  has(key: string): Promise<boolean>;
  get(key: string): Promise<unknown | undefined>;
}

export interface EnumerablePropertySource<T> extends PropertySource<T> {
  keys(): Iterable<string>;
}

export interface KVSource<T = boolean | number | string | KVSource<unknown>> {
  [key: string]: T | undefined;
}

export interface PropertySources extends Array<PropertySource> {
  has(propertySource: string): boolean;
  get(propertySource: string): PropertySource | undefined;
}

export class StandardEnvironment implements Environment {
  readonly propertySources: PropertySources;
  constructor(propertySources: PropertySources) {
    this.propertySources = propertySources;
  }
  async has(key: string): Promise<boolean> {
    return this.propertySources.some(async (ps) => await ps.has(key));
  }
  async get<T = unknown>(key: string): Promise<T | unknown | undefined> {
    return this.propertySources.find(async (ps) => await ps.has(key))?.get(key);
  }
  getActiveProfiles(): Profiles[] {
    throw new Error('Method not implemented.');
  }
  acceptsProfiles(profiles: Profiles): boolean {
    throw new Error('Method not implemented.');
  }
}

export class ImmutablePropertySources extends Array<PropertySource>
  implements PropertySources {
  readonly myMap: Map<string, PropertySource>;
  constructor(...propertySources: PropertySource[]) {
    super();
    this.push(...propertySources);
    this.myMap = new Map(propertySources.map((ps) => [ps.name, ps]));
    if (this.length !== this.myMap.size) {
      throw new Error(
        `you should not have duplicate named property sources ${this.map(
          (p) => p.name
        )}`
      );
    }
  }

  has(key: string): boolean {
    return this.myMap.has(key);
  }
  get(key: string): PropertySource<unknown> {
    return this.get(key);
  }
}

export class MapPropertySource<T = unknown>
  implements EnumerablePropertySource<Map<string, T>> {
  constructor(readonly name: string, readonly source: Map<string, T>) {}
  async load(): Promise<void> {
    return;
  }

  keys(): Iterable<string> {
    return this.source.keys();
  }

  async has(key: string): Promise<boolean> {
    return this.source.has(key);
  }

  async get(key: string): Promise<T | undefined> {
    return this.source.get(key);
  }
}

export class ObjectPropertySource implements PropertySource<KVSource> {
  public constructor(readonly name: string, public source: KVSource) {}
  async load(): Promise<void> {
    return;
  }
  async has(key: string): Promise<boolean> {
    const res = JSONPath({ path: key, json: this.source ?? {}, wrap: false });
    return res !== undefined;
  }
  async get(key: string): Promise<undefined | unknown> {
    return JSONPath({ path: key, json: this.source, wrap: false });
  }
}

export class DelegatingCachingPropertySouce implements PropertySource {
  readonly name: string;
  private readonly cache: Map<string, undefined | unknown> = new Map();

  constructor(readonly source: PropertySource) {
    this.name = source.name;
  }
  load(): Promise<void> {
    return this.source.load();
  }
  async has(key: string): Promise<boolean> {
    const has = this.cache.has(key);
    if (has) return has;
    const value = this.source.get(key);
    this.cache.set(key, value);
    return this.has(key);
  }

  async get(key: string): Promise<unknown | undefined> {
    const has = this.cache.has(key);
    if (!has) return undefined;
    return this.get(key);
  }
}

export class ObjectFilePropertySource extends ObjectPropertySource {
  readonly name: string;

  constructor(filename: string, readonly parser: (buffer: Buffer) => KVSource) {
    super(filename, {});
    this.name = filename;
  }

  async load(): Promise<void> {
    return new Promise((resolve) => {
      readFile(this.name, (err, data) => {
        if (err) throw err;
        this.source = this.parser(data);
        resolve();
      });
    });
  }
}

export class ProcessEnvironmentPropertySource
  implements EnumerablePropertySource<KVSource<string>> {
  constructor(readonly name: string, readonly source: KVSource<string>) {}
  async load(): Promise<void> {
    return;
  }
  keys(): Iterable<string> {
    return Object.keys(this.source);
  }
  async has(key: string): Promise<boolean> {
    return this.source[constantCase(key)] !== undefined;
  }
  async get(key: string): Promise<string | undefined> {
    return this.source[constantCase(key)];
  }
}
