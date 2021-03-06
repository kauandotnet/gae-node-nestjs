import { RequestScopeMiddleware } from './request-scope.middleware';
import {
  getRequestScopeValue,
  getRequestScopeValueRequired,
  isRequestScopeEnabled,
  setRequestScopeValue,
} from './request-scope';
import { Request, Response } from 'express';
import { mock } from 'ts-mockito';
import { reset } from 'cls-hooked';
import { Configuration } from '../configuration';
import { partialInstance } from '../_test/mocks';
import { RequestScopeInterceptor } from './request-scope-interceptor';

class TestInterceptor implements RequestScopeInterceptor {
  name = 'test-interceptor';

  intercept(req: Request): void {
    setRequestScopeValue('test-key', 'test-value');
  }
}

function requestScopeMiddleware(config: Configuration) {
  return new RequestScopeMiddleware(config, [new TestInterceptor()]);
}

describe('RequestScopeInterceptor', () => {
  let req: Request;
  let res: Response;
  let config: Configuration;

  beforeEach(() => {
    reset();
    req = mock<Request>();
    res = mock<Response>();
    config = partialInstance();
  });
  afterEach(() => {
    reset();
  });

  it('calls interceptors and shares request scope with anything within next function', () => {
    config.requestScope = { enabled: true };
    let called = false;

    requestScopeMiddleware(config).use(req, res, () => {
      expect(getRequestScopeValueRequired('test-key')).toBe('test-value');
      expect(getRequestScopeValue('something-does-not-exist')).toBeNull();
      called = true;
    });

    expect(called).toBeTruthy();
  });

  it('calls next function but does not setup any request scope when disabled by config', () => {
    config.requestScope = { enabled: false };
    let called = false;

    requestScopeMiddleware(config).use(req, res, () => {
      expect(isRequestScopeEnabled()).toBe(false);
      expect(() => getRequestScopeValueRequired('test-key')).toThrowError('No active context namespace exists');
      called = true;
    });

    expect(called).toBeTruthy();
  });

  it('is disabled by default when no config is set for request scope', () => {
    let called = false;

    requestScopeMiddleware(config).use(req, res, () => {
      expect(isRequestScopeEnabled()).toBe(false);
      expect(() => getRequestScopeValueRequired('test-key')).toThrowError('No active context namespace exists');
      called = true;
    });

    expect(called).toBeTruthy();
  });
});
