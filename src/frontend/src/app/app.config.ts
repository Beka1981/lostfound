import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';
export const authInterceptor:HttpInterceptorFn=(req,next)=>{const token=localStorage.getItem('accessToken');const authorized=token?req.clone({setHeaders:{Authorization:`Bearer ${token}`}}):req;return next(authorized).pipe(catchError(error=>{const refreshToken=localStorage.getItem('refreshToken');if(error.status!==401||!refreshToken||req.url.includes('/auth/'))return throwError(()=>error);return from(fetch('/api/v1/auth/refresh',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken})}).then(async response=>{if(!response.ok)throw error;return response.json()})).pipe(switchMap((auth:any)=>{localStorage.setItem('accessToken',auth.accessToken);localStorage.setItem('refreshToken',auth.refreshToken);localStorage.setItem('accessExpiresAtUtc',auth.expiresAtUtc);return next(req.clone({setHeaders:{Authorization:`Bearer ${auth.accessToken}`}}))}),catchError(()=>{localStorage.removeItem('accessToken');localStorage.removeItem('refreshToken');return throwError(()=>error)}))}))};

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(), provideRouter(routes), provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
