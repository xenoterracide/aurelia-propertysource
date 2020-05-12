import { constantCase } from 'constant-case';
import { readFile } from 'fs';
import { JSONPath } from 'jsonpath-plus';
import { DI } from '@aurelia/kernel';

export const RequiredProperties = DI.createInterface<Array<string>>(
  'RequiredProperties'
).noDefault();
export const Environment = DI.createInterface<Environment>(
  'Environment'
).noDefault();

type Value = undefined | unknown;
type TypedValue<T> = undefined | T;
type Converter<T> = (value: Value) => T;

export interface Environment extends PropertyResolver {
  getActiveProfiles(): Profiles[];
  acceptsProfiles(profiles: Profiles): boolean;
}

export interface Profiles {
  matches(activeProfiles: (profile: string) => boolean): boolean;
}

export interface PropertyResolver {
  hasAsync(key: string): Promise<boolean>;
  getAsync<T>(key: string, converter?: Converter<T>): Promise<TypedValue<T>>;
  has(key: string): boolean;

  get(key: string): Value;
  get<T>(key: string, converter: Converter<T>): TypedValue<T>;
}

export interface PropertySource<T = unknown> {
  readonly name: string;
  readonly source: T;

  load(keys: string[]): Promise<void>;

  hasAsync(key: string): Promise<boolean>;
  getAsync(key: string): Promise<unknown | undefined>;
  has(key: string): boolean;
  get(key: string): unknown | undefined;
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
  loadAll(keys: string[]): Promise<unknown>;
}

export class StandardEnvironment implements Environment {
  readonly propertySources: PropertySources;
  constructor(propertySources: PropertySources) {
    this.propertySources = propertySources;
  }
  get(key: string): unknown;
  get<T>(
    key: string,
    converter: (value: unknown | undefined) => T
  ): T | undefined;
  get<T = unknown>(
    key: string,
    converter?: (value: unknown | undefined) => T
  ): T | unknown | undefined {
    const conv = converter ?? ((value: unknown): unknown => value);
    return conv(this.propertySources.find((ps) => ps.has(key))?.get(key));
  }
  getAsync<T>(
    key: string,
    converter?: ((value: unknown) => T) | undefined
  ): Promise<T | undefined> {
    throw new Error('Method not implemented.');
  }
  has(key: string): boolean {
    throw new Error('Method not implemented.');
  }

  async hasAsync(key: string): Promise<boolean> {
    return this.propertySources.some(async (ps) => await ps.has(key));
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
  async loadAll(keys: string[]): Promise<unknown> {
    return Promise.all(this.map((ps) => ps.load(keys)));
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

  async hasAsync(key: string): Promise<boolean> {
    return this.has(key);
  }
  async getAsync(key: string): Promise<unknown> {
    return this.get(key);
  }

  has(key: string): boolean {
    return this.source.has(key);
  }

  get(key: string): T | undefined {
    return this.source.get(key);
  }
}

export class ObjectPropertySource implements PropertySource<KVSource> {
  public constructor(readonly name: string, public source: KVSource) {}

  async load(): Promise<void> {
    return;
  }

  async hasAsync(key: string): Promise<boolean> {
    return this.has(key);
  }
  async getAsync(key: string): Promise<unknown> {
    return this.get(key);
  }
  has(key: string): boolean {
    const res = JSONPath({ path: key, json: this.source, wrap: false });
    return res !== undefined;
  }
  get(key: string): Promise<undefined | unknown> {
    return JSONPath({ path: key, json: this.source, wrap: false });
  }
}

export class DelegatingCachingPropertySouce implements PropertySource {
  readonly name: string;
  private readonly cache: Map<string, undefined | unknown> = new Map();

  constructor(readonly source: PropertySource) {
    this.name = source.name;
  }
  async hasAsync(key: string): Promise<boolean> {
    let has = this.has(key);
    if (has) return has;
    has = await this.source.hasAsync(key);
    if (has) {
      const value = await this.source.getAsync(key);
      this.cache.set(key, value);
    }
    return this.has(key);
  }
  async getAsync(key: string): Promise<unknown> {
    const has = this.has(key);
    if (has) return this.get(key);
    const value = await this.source.getAsync(key);
    if (value) this.cache.set(key, value);
    return this.getAsync(key);
  }
  load(keys: string[]): Promise<void> {
    return this.source.load(keys);
  }
  has(key: string): boolean {
    const has = this.cache.has(key);
    if (has) return has;
    const value = this.source.get(key);
    this.cache.set(key, value);
    return this.has(key);
  }

  get(key: string): unknown | undefined {
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
  async hasAsync(key: string): Promise<boolean> {
    return this.has(key);
  }
  async getAsync(key: string): Promise<unknown> {
    return this.get(key);
  }
  async load(): Promise<void> {
    return;
  }
  keys(): Iterable<string> {
    return Object.keys(this.source);
  }
  has(key: string): boolean {
    return this.source[constantCase(key)] !== undefined;
  }
  get(key: string): string | undefined {
    return this.source[constantCase(key)];
  }
}
