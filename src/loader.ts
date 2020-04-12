import dotenv from 'dotenv';
import fs from 'fs';
import { Constructable, IContainer, ILogger, IRegistry, Registration } from '@aurelia/kernel';
import {
    Environment,
    ImmutablePropertySources,
    ProcessEnvironmentPropertySource,
    PropertySource,
    PropertySourceLoader,
    StandardEnvironment,
} from './env';

export class DotEnvEnvironmentLoader implements PropertySourceLoader {
    load(key: string): PropertySource {
        return new ProcessEnvironmentPropertySource(key, dotenv.parse(fs.readFileSync(key)));
    }
}
export class NodeProcessEnvironmentLoader implements PropertySourceLoader {
    load(key: string): PropertySource {
        return new ProcessEnvironmentPropertySource(key, process.env);
    }
}

function isNotUndefined<T>(value: T): value is Exclude<T, undefined> {
    return value !== undefined;
}
export class EnvironmentLoader implements IRegistry {
    static node(log: ILogger): EnvironmentLoader {
        return new EnvironmentLoader(log, [NodeProcessEnvironmentLoader, 'env'], [DotEnvEnvironmentLoader, '.env']);
    }

    readonly #loaders: [Constructable<PropertySourceLoader>, string][];
    constructor(private readonly log: ILogger, ...loaders: [Constructable<PropertySourceLoader>, string][]) {
        this.#loaders = loaders;
    }

    register(container: IContainer): void {
        const pss: Array<PropertySource> = this.#loaders
            .map((ld) => {
                try {
                    return new ld[0]().load(ld[1]);
                } catch (e) {
                    this.log.error('error', e);
                    return undefined;
                }
            })
            .filter(isNotUndefined);

        const env = new StandardEnvironment(new ImmutablePropertySources(...pss));
        container.register(Registration.instance(Environment, env));
    }
}
