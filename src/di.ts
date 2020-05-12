/// <reference types="reflect-metadata" />
import '@aurelia/metadata';
import {
  DI,
  IContainer,
  IRegistration,
  IResolver,
  Resolved,
} from '@aurelia/kernel';
import { Environment } from './environment';

export class EnvironmentResolver implements IResolver, IRegistration {
  constructor(private readonly key: string) {}

  get $isResolver(): true {
    return true;
  }

  register(container: IContainer): IResolver<void> {
    return container.registerResolver(this.key, this);
  }
  resolve(handler: IContainer): Resolved<unknown> {
    return handler.get(Environment).get(this.key);
  }
}

export function value<T extends string>(target: T): Function {
  return DI.inject(new EnvironmentResolver(target));
}
