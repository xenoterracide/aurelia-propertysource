import anyTest, { TestInterface } from 'ava';
import { DI, IContainer } from '@aurelia/kernel';
import { value } from '../src/decorator';

const test = anyTest as TestInterface<IContainer>;

test.before((t) => {
    t.context = DI.createContainer();
});

test('test', (t) => {
    class Foo {
        constructor (@value('test') readonly string: string) {
        }
    }

    t.is(t.context.get(Foo).string, 'hello');
});
