import { DI, IContainer, inject, Registration } from '@aurelia/kernel';
import { EnvironmentResolver, value } from '../src/di';
import { Environment, ImmutablePropertySources, ObjectPropertySource, StandardEnvironment } from '../src/env';

describe(`Aurelia DI test`, () => {
    let container: IContainer;
    const myDefault = new ObjectPropertySource('default', {
        myprop: 1,
    });

    beforeEach(() => {
        container = DI.createContainer();
        container.register(
            Registration.instance(Environment, new StandardEnvironment(new ImmutablePropertySources(myDefault)))
        );
    });

    test('test value', () => {
        class Foo {
            constructor(@value('myprop') readonly myprop: string) {}
        }

        expect(container.get(Foo).myprop).toBe(1);
    });

    test('direct get', () => {
        container.register(new EnvironmentResolver('myprop'));
        expect(container.get('myprop')).toBe(1);
    });

    test('inject into a dependency', () => {
        container.register(new EnvironmentResolver('myprop'));
        class Foo {
            constructor(@inject('myprop') readonly myprop: string) {}
        }

        expect(container.get(Foo).myprop).toBe(1);
    });
});
