import { DI, IContainer, Registration } from '@aurelia/kernel';
import { property, value } from '../src/di';
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

    test('direct get', () => {
        container.register(property('a'));
        expect(container.get('a')).toBe(1);
    });

    test('get injected', () => {
        class Foo {
            constructor(@value('myprop') readonly myprop: string) {}
        }

        expect(container.get(Foo).myprop).toBe(1);
    });
});
