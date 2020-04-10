import at, { TestInterface } from 'ava';
import { DI, IContainer } from '@aurelia/kernel';

const test = at as TestInterface<IContainer>;

test.beforeEach((t) => {
    t.context = DI.createContainer();
});
