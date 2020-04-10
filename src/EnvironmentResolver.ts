import { constantCase } from 'constant-case';
import { IContainer, IRegistration, IResolver } from '@aurelia/kernel';

export class PropertySourceResolver implements IResolver, IRegistration {
    constructor (private readonly key: string) {
    }

    register (container: IContainer): IResolver<void> {
        return container.registerResolver(this.key, this);
    }
    resolve (): string {
        const envKey = constantCase(this.key);
        const val = process.env[ envKey ];
        if (val === undefined) {
            throw new Error();
        }
        return val;
    }
}
