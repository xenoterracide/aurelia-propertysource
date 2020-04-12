/// <reference types="reflect-metadata" />
import '@aurelia/metadata';
import { Constructable, IContainer, IRegistration, IResolver, Resolved } from '@aurelia/kernel';
import { Environment } from './env';

export function valueDecorator(property: string): Function {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (ctor: Constructable, _: undefined, position: number): void {
        const data: [string, number] = [property, position];
        Reflect.defineMetadata('aupropertysource:value', data, ctor);
    };
}

export function value<T extends string>(): typeof valueDecorator;
export function value<T extends string>(target: T): Function;
export function value<T extends string>(target?: T): Function | typeof valueDecorator {
    return target == null || target == undefined ? valueDecorator : valueDecorator(target);
}

export class EnvironmentResolver implements IResolver, IRegistration {
    constructor(private readonly key: string) {}

    register(container: IContainer): IResolver<void> {
        return container.registerResolver(this.key, this);
    }
    resolve(handler: IContainer): Resolved<unknown> {
        return handler.get(Environment).get(this.key);
    }
}

export function property(key: string): IResolver {
    return new EnvironmentResolver(key);
}
