import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

function isTokenExpired(token: string): boolean {
  if (!token) return true;
  if (token.startsWith('dev-')) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return payload.exp * 1000 < (Date.now() + 5000);
  } catch {
    return true;
  }
}

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  let token = authService.token;

  // Do not attach Bearer token to S3 presigned URLs (which use S3 SigV4 query params)
  if (req.url.includes('X-Amz-Algorithm') || (req.method === 'PUT' && req.url.includes('/alldare-media/'))) {
    return next(req);
  }

  if (token) {
    if (isTokenExpired(token)) {
      // Proactively clear expired token before dispatching request
      authService.logout();
      token = null;
    } else {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && authService.token) {
        // Stale token rejected by server; clear session
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
