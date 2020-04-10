import { ObjectPropertySource } from '../ps';

describe(`${ ObjectPropertySource.name }`, () => {
    test('simple kv', () => {
        const ps = new ObjectPropertySource('test', { hello: 'world' });

        expect(ps.has('hello')).toBe(true);
        expect(ps.get('hello')).toBe('world');
        expect(ps.has('goodbye')).toBe(false);
        expect(ps.get('goodbye')).toBe(undefined);
    });
});
