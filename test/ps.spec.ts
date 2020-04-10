import test from 'ava';
import { ObjectPropertySource } from '../src/ps';

test(`${ ObjectPropertySource }`, (t) => {
    const ps = new ObjectPropertySource('test', { hello: 'world' });

    t.is(ps.has('hello'), true);
    t.is(ps.get('hello'), 'world');
    t.is(ps.has('goodbye'), false);
    t.is(ps.get('goodbye'), undefined);
});
