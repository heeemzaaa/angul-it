import { TestBed } from '@angular/core/testing';
import { CanActivateFn, UrlTree } from '@angular/router';

import { CaptchaState } from '../services/captcha-state';
import { completeAllStages } from '../testing/captcha-test-helpers';
import { sessionActiveGuard } from './session-active-guard';

describe('sessionActiveGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => sessionActiveGuard(...guardParameters));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('allows activation while the session still has incomplete stages', () => {
    const result = executeGuard({} as never, {} as never);
    expect(result).toBe(true);
  });

  it('redirects to /result once every stage is already completed — e.g. revisiting /captcha after finishing', () => {
    const state = TestBed.inject(CaptchaState);
    completeAllStages(state);

    const result = executeGuard({} as never, {} as never);

    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/result');
  });
});
