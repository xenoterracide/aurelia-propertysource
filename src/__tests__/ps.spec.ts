import { MapPropertySource, ObjectPropertySource, ProcessEnvironmentPropertySource } from '../ps';

describe(`${ ObjectPropertySource.name }`, () => {
    test('simple', () => {
        const ps = new ObjectPropertySource('test', { hello: 'world' });

        expect(ps.has('hello')).toBe(true);
        expect(ps.get('hello')).toBe('world');
        expect(ps.has('goodbye')).toBe(false);
        expect(ps.get('goodbye')).toBe(undefined);
    });

    test('nested', () => {
        const ps = new ObjectPropertySource('test', {
            nested: {
                key: 'val'
            }
        });

        expect(ps.has('nested.key')).toBe(true);
        expect(ps.get('nested.key')).toBe('val');
        expect(ps.has('even.more.nested')).toBe(false);
        expect(ps.get('even.more.nested')).toBe(undefined);
    });
});


describe(`${ ProcessEnvironmentPropertySource.name }`, () => {
    test('simple', () => {
        const ps = new ProcessEnvironmentPropertySource('test', { HELLO: 'world' });

        expect(ps.has('hello')).toBe(true);
        expect(ps.get('hello')).toBe('world');
        expect(ps.has('goodbye')).toBe(false);
        expect(ps.get('goodbye')).toBe(undefined);
    });

    test('nested', () => {
        const ps = new ProcessEnvironmentPropertySource('test', {
            NESTED_KEY: 'val',
        });

        expect(ps.has('nested.key')).toBe(true);
        expect(ps.get('nested.key')).toBe('val');
        expect(ps.has('even.more.nested')).toBe(false);
        expect(ps.get('even.more.nested')).toBe(undefined);
    });
});

describe(`${ MapPropertySource.name }`, () => {
    test('simple', () => {
        const ps = new MapPropertySource('test', new Map([ [ 'hello', 'world' ] ]));

        expect(ps.has('hello')).toBe(true);
        expect(ps.get('hello')).toBe('world');
        expect(ps.has('goodbye')).toBe(false);
        expect(ps.get('goodbye')).toBe(undefined);
    });

    test('nested', () => {
        const ps = new MapPropertySource('test', new Map([
            [ 'nested.key', 'val' ],
        ]));

        expect(ps.has('nested.key')).toBe(true);
        expect(ps.get('nested.key')).toBe('val');
        expect(ps.has('even.more.nested')).toBe(false);
        expect(ps.get('even.more.nested')).toBe(undefined);
    });
});
