import { JSONPath } from 'jsonpath-plus';

export function value(property: string): Function {
    return function (): void {
        const res = JSONPath({
            wrap: false,
            path: property, json: {
                public: {
                    test: 'hello',
                }
            }
        });
    }
}
