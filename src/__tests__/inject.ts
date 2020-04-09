import { DI, ILogger, LoggerConfiguration } from '@aurelia/kernel';
import { value } from '../decorator';

describe('hello', function () {

    const container = DI.createContainer();
    container.register(LoggerConfiguration.create(console));

    it('test', function () {
        class Foo {
            constructor(@value('public.test') string: string) {
                container.get(ILogger).warn(() => '%j', string);
            }
        }

        expect(container.get(Foo)).toBeDefined();
    })
});
