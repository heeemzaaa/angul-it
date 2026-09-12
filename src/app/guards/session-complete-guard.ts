import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CaptchaState } from '../services/captcha-state';


export const sessionCompleteGuard: CanActivateFn = () => {
  const captchaState = inject(CaptchaState);
  const router = inject(Router);

  if (captchaState.isComplete()) {
    return true;
  }
  // Not finished yet — send the user back to the stage they're on.
  return router.createUrlTree(['/captcha']);
};
