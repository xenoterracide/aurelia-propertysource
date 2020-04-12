import {
    ImmutablePropertySources,
    MapPropertySource,
    ObjectPropertySource,
    ProcessEnvironmentPropertySource,
    StandardEnvironment,
} from '../src/env';

describe(`${StandardEnvironment.name}`, () => {
    const envS = new ProcessEnvironmentPropertySource('env', {
        LOG_LEVEL: 'trace',
    });
    const altS = new ObjectPropertySource('prod.config', {
        log: {
            dest: 'file',
            file: 'my.log',
        },
    });
    const objS = new ObjectPropertySource('config', {
        log: {
            level: 'debug',
        },
    });
    // defaults
    const mapS = new MapPropertySource(
        'defaults',
        new Map([
            ['log.level', 'info'],
            ['log.dest', 'console'],
            ['log.format', 'theirformat'],
        ])
    );

    test(`prod order`, () => {
        const resolver = new StandardEnvironment(new ImmutablePropertySources(envS, altS, objS, mapS));

        expect(resolver.has('log.level')).toBe(true);
        expect(resolver.has('log.dest')).toBe(true);
        expect(resolver.has('log.format')).toBe(true);
        expect(resolver.has('log.file')).toBe(true);

        expect(resolver.get('log.level')).toBe('trace');
        expect(resolver.get('log.dest')).toBe('file');
        expect(resolver.get('log.format')).toBe('theirformat');
        expect(resolver.get('log.file')).toBe('my.log');
    });
});

describe(`${ImmutablePropertySources.name}`, () => {
    test('unique names same source', () => {
        new ImmutablePropertySources(new MapPropertySource('a', new Map()), new MapPropertySource('b', new Map()));
    });
    test('same names same source', () => {
        expect(() => {
            new ImmutablePropertySources(new MapPropertySource('a', new Map()), new MapPropertySource('a', new Map()));
        }).toThrowError();
    });
    test('is array', () => {
        expect(new ImmutablePropertySources(new ObjectPropertySource('a', {}))).toBeInstanceOf(Array);
    });
});
describe(`${ObjectPropertySource.name}`, () => {
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
                key: 'val',
            },
        });

        expect(ps.has('nested.key')).toBe(true);
        expect(ps.get('nested.key')).toBe('val');
        expect(ps.has('even.more.nested')).toBe(false);
        expect(ps.get('even.more.nested')).toBe(undefined);
    });
});
describe(`${ProcessEnvironmentPropertySource.name}`, () => {
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

    test('nested', () => {
        const ps = new ProcessEnvironmentPropertySource('test', {
            A: 'B',
            A_B: 'C',
            A_B_C: 'D',
        });

        expect(ps.get('a')).toBe('B');
        expect(ps.get('a.b')).toBe('C');
        expect(ps.get('a.b.c')).toBe('D');
    });
});
describe(`${MapPropertySource.name}`, () => {
    test('simple', () => {
        const ps = new MapPropertySource('test', new Map([['hello', 'world']]));

        expect(ps.has('hello')).toBe(true);
        expect(ps.get('hello')).toBe('world');
        expect(ps.has('goodbye')).toBe(false);
        expect(ps.get('goodbye')).toBe(undefined);
    });

    test('nested', () => {
        const ps = new MapPropertySource('test', new Map([['nested.key', 'val']]));

        expect(ps.has('nested.key')).toBe(true);
        expect(ps.get('nested.key')).toBe('val');
        expect(ps.has('even.more.nested')).toBe(false);
        expect(ps.get('even.more.nested')).toBe(undefined);
    });
});
