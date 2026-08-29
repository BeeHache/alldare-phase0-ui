import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent) },
  { path: 'auth/callback', loadComponent: () => import('./features/auth/auth-callback.component').then(m => m.AuthCallbackComponent) },
  { path: 'podcasts', loadComponent: () => import('./features/podcasts/podcast-list.component').then(m => m.PodcastListComponent), canActivate: [authGuard] },
  { path: 'studio/:slug', loadComponent: () => import('./features/studio/studio.component').then(m => m.StudioComponent), canActivate: [authGuard] },
  { path: 'studio', loadComponent: () => import('./features/studio/studio.component').then(m => m.StudioComponent), canActivate: [authGuard] },
  { path: 'podcast/:slug/index.html', loadComponent: () => import('./features/podcast-public/podcast-public.component').then(m => m.PodcastPublicComponent) },
  { path: 'podcast/:slug', loadComponent: () => import('./features/podcast-public/podcast-public.component').then(m => m.PodcastPublicComponent) },
  { path: ':slug/index.html', loadComponent: () => import('./features/podcast-public/podcast-public.component').then(m => m.PodcastPublicComponent) },
  { path: ':slug', loadComponent: () => import('./features/podcast-public/podcast-public.component').then(m => m.PodcastPublicComponent) },
  { path: '', redirectTo: 'podcasts', pathMatch: 'full' },
  { path: '**', redirectTo: 'podcasts' }
];
