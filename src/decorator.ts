
/// <reference types="reflect-metadata" />
import '@aurelia/metadata';
import { Constructable } from '@aurelia/kernel';

export function valueDecorator (property: string): Function {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function (ctor: Constructable, _: undefined, position: number): void {
        const data: [ string, number ] = [ property, position ];
        Reflect.defineMetadata('aupropertysource:value', data, ctor);
    };
}

export function value<T extends string> (): typeof valueDecorator;
export function value<T extends string> (target: T): Function;
export function value<T extends string> (target?: T): Function | typeof valueDecorator {
    return target == null || target == undefined ? valueDecorator : valueDecorator(target);
}
