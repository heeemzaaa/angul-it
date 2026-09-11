import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CaptchaState } from '../services/captcha-state';

/**
 * Blocks direct navigation to /result unless every CAPTCHA stage has been
 * completed. Reads CaptchaState — the same source of truth CaptchaComponent
 * uses — rather than anything route-specific, so it stays correct however
 * the user got here (typed URL, back button, bookmark, refresh).
 */
export const sessionCompleteGuard: CanActivateFn = () => {
  const captchaState = inject(CaptchaState);
  const router = inject(Router);

  return captchaState.isComplete() || router.createUrlTree(['/captcha']);
};
