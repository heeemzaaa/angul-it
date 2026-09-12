import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CaptchaState } from '../services/captcha-state';


export const sessionActiveGuard: CanActivateFn = () => {
  const captchaState = inject(CaptchaState);
  const router = inject(Router);

  if (!captchaState.isComplete()) {
    return true;
  }
  // Every stage is already done — send the user to the results page instead.
  return router.createUrlTree(['/result']);
};
