import { Routes } from '@angular/router';
import { StudioComponent } from './features/studio/studio.component';
import { LoginComponent } from './features/auth/login.component';
import { AuthCallbackComponent } from './features/auth/auth-callback.component';
import { PodcastListComponent } from './features/podcasts/podcast-list.component';
import { PodcastPublicComponent } from './features/podcast-public/podcast-public.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'podcasts', component: PodcastListComponent, canActivate: [authGuard] },
  { path: 'studio/:slug', component: StudioComponent, canActivate: [authGuard] },
  { path: 'studio', component: StudioComponent, canActivate: [authGuard] },
  { path: 'podcast/:slug/index.html', component: PodcastPublicComponent },
  { path: 'podcast/:slug', component: PodcastPublicComponent },
  { path: '', redirectTo: 'podcasts', pathMatch: 'full' },
  { path: '**', redirectTo: 'podcasts' }
];
