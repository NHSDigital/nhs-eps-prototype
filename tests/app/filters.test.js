const filters = require('../../app/filters');

test('test filters returns non empty', () => {
    const result = filters();

    expect(result).not.toStrictEqual({});
});