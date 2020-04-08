import { DI } from '@aurelia/kernel';

describe('hello', function () {

    const container = DI.createContainer();

    it('test', function () {
        expect(container).toBeDefined();
    })
});
