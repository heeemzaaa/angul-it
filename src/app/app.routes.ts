import { Routes } from '@angular/router';
import { sessionActiveGuard } from './guards/session-active-guard';
import { sessionCompleteGuard } from './guards/session-complete-guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then((m) => m.Home),
  },
  {
    path: 'captcha',
    loadComponent: () => import('./pages/captcha/captcha').then((m) => m.Captcha),
    canActivate: [sessionActiveGuard],
  },
  {
    path: 'result',
    loadComponent: () => import('./pages/result/result').then((m) => m.Result),
    canActivate: [sessionCompleteGuard],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
