import { DI, Registration } from '@aurelia/kernel';
import { property } from '../src/di';
import { Environment, ImmutablePropertySources, ObjectPropertySource, StandardEnvironment } from '../src/env';

describe(`Aurelia DI test`, () => {
    const myDefault = new ObjectPropertySource('default', {
        A: 1,
    });

    test(`test`, () => {
        const container = DI.createContainer();
        container.register(
            Registration.instance(Environment, new StandardEnvironment(new ImmutablePropertySources(myDefault)))
        );
        container.register(property('a'));
        expect(container.get('a')).toBe(1);
    });
});
