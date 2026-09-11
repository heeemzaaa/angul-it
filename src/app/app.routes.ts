import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'captcha',
    loadComponent: () => import('./pages/captcha/captcha').then((m) => m.Captcha),
  },
  {
    path: 'result',
    loadComponent: () => import('./pages/result/result').then((m) => m.Result),
    // TODO (step 5): guard this route so it redirects to /captcha unless every
    // stage is completed — see CaptchaSession / isSessionComplete().
  },
  {
    path: '**',
    redirectTo: '',
  },
];
