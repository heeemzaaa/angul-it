import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CaptchaState } from '../services/captcha-state';


export const sessionCompleteGuard: CanActivateFn = () => {
  const captchaState = inject(CaptchaState);
  const router = inject(Router);

  return captchaState.isComplete() || router.createUrlTree(['/captcha']);
};
