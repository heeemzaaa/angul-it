import { TestBed } from '@angular/core/testing';
import { CanActivateFn, UrlTree } from '@angular/router';

import { CaptchaState } from '../services/captcha-state';
import { completeAllStages } from '../testing/captcha-test-helpers';
import { sessionCompleteGuard } from './session-complete-guard';

describe('sessionCompleteGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => sessionCompleteGuard(...guardParameters));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('redirects to /captcha when the session is not yet complete', () => {
    const result = executeGuard({} as never, {} as never);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/captcha');
  });

  it('allows activation once every stage has been completed', () => {
    const state = TestBed.inject(CaptchaState);
    completeAllStages(state);

    const result = executeGuard({} as never, {} as never);

    expect(result).toBe(true);
  });
});
