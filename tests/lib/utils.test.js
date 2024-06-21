import { addNunjucksFilters, matchRoutes, autoStoreData } from '../../lib/utils';

const coreFilters = require('../../lib/core_filters');
jest.mock('../../lib/core_filters');
const customFilters = require('../../app/filters');
jest.mock('../../app/filters');

test('test addNunjucksFilters filter added', () => {
    coreFilters.mockImplementation(() => {return {1: "core-filter"};});
    customFilters.mockImplementation(() => {return {2: "custom-filter"};});
    const mockEnv = {
        addFilter: jest.fn((filter) => {
            return;
        }),
    };
    
    addNunjucksFilters(mockEnv);

    expect(coreFilters).toHaveBeenCalledTimes(1);
    expect(customFilters).toHaveBeenCalledTimes(1);
    expect(mockEnv.addFilter).toHaveBeenCalledTimes(2);
});

test.each([
  {
    render_value: jest.fn((routePath, cb) => {
      // Call the callback with a template not found error the first time
      cb();
    }),
    mockResponseSetCallCount: 1,
    mockResponseEndCallCount: 1,
    mockNextCallCount: 0,
    scenarioDescription: 'test matchRoutes no error'
  },
  {
    render_value: jest.fn((routePath, cb) => {
      // Call the callback with a template not found error the first time
      cb(new Error('template in folder'));
    }),
    mockResponseSetCallCount: 0,
    mockResponseEndCallCount: 0,
    mockNextCallCount: 1,
    scenarioDescription: 'test matchRoutes with other error'
  },
  {
    render_value: jest.fn((routePath, cb) => {
      // Call the callback with a template not found error the first time
      cb(new Error('template not found'));
    }),
    mockResponseSetCallCount: 0,
    mockResponseEndCallCount: 0,
    mockNextCallCount: 1,
    scenarioDescription: 'test matchRoutes with template error'
  }

])("$scenarioDescription", ({render_value, mockResponseSetCallCount, mockResponseEndCallCount, mockNextCallCount}) => {
  const mockRequest = {
    path: "http://www.example.com"
  };


  const mockResponse = {
      set: jest.fn(),
      end: jest.fn(),
      render: render_value,
  };

  const mockNext = jest.fn();

  matchRoutes(mockRequest, mockResponse, mockNext);

  expect(mockResponse.render).toHaveBeenCalled();
  expect(mockResponse.set).toHaveBeenCalledTimes(mockResponseSetCallCount);
  expect(mockResponse.end).toHaveBeenCalledTimes(mockResponseEndCallCount);
  expect(mockNext).toHaveBeenCalledTimes(mockNextCallCount);

})



test('test matchRoutes with empty path', () => {
    const mockRequest = {
        path: "",
    };

    const mockResponse = {
        set: jest.fn(),
        end: jest.fn(),
        render: jest.fn((routePath, cb) => {
            // Call the callback with a template not found error the first time
            cb(new Error('template not found'));
          }),
    };

    const mockNext = jest.fn();

    matchRoutes(mockRequest, mockResponse, mockNext);

    expect(mockResponse.render).toHaveBeenCalled();
    expect(mockResponse.set).not.toHaveBeenCalled();
    expect(mockResponse.end).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
});

test('autoStoreData with request session data not set', () => {
    const mockRequest = {
        session: {},
        body: {1: {2:"two"}},
        query: {"_one": "_one"},
    };

    const mockResponse = {
        set: jest.fn(),
        end: jest.fn(),
        render: jest.fn((routePath, cb) => {
            // Call the callback with a template not found error the first time
            cb(new Error('template not found'));
          }),
        locals:{data:{}},
    };

    const mockNext = jest.fn();

    autoStoreData(mockRequest, mockResponse, mockNext);

    expect(mockResponse.locals.data).toMatchObject({1:{2:"two"}});
});

test('autoStoreData with unchecked in the request', () => {
    const mockRequest = {
        session: {},
        body: {1: "_unchecked"},
        query: {2: ["one", "_unchecked", "three"]},
    };

    const mockResponse = {
        set: jest.fn(),
        end: jest.fn(),
        render: jest.fn((routePath, cb) => {
            // Call the callback with a template not found error the first time
            cb(new Error('template not found'));
          }),
        locals:{data:{}},
    };

    const mockNext = jest.fn();

    autoStoreData(mockRequest, mockResponse, mockNext);

    expect(mockResponse.locals.data).toMatchObject({2: ["one", "three",],});
});
