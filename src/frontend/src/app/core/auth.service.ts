import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface AuthResponse { accessToken:string; expiresAtUtc:string; refreshToken:string }
export interface RegisterModel { accountType:0|1; email:string; password:string; firstName?:string; lastName?:string; organizationName?:string; responsiblePerson?:string; phoneNumber?:string }

@Injectable({providedIn:'root'})
export class AuthService {
  private http=inject(HttpClient); private router=inject(Router);
  private token=signal(localStorage.getItem('accessToken'));
  authenticated=computed(()=>!!this.token());
  userId=computed(()=>{try{const body=JSON.parse(atob((this.token()||'').split('.')[1]));return body.sub as string}catch{return ''}});
  roles=computed<string[]>(()=>{try{const b=JSON.parse(atob((this.token()||'').split('.')[1]));const r=b.role||b['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']||[];return Array.isArray(r)?r:[r]}catch{return []}});
  hasRole(role:string){return this.roles().includes(role)}
  login(email:string,password:string){return this.http.post<AuthResponse>('/api/v1/auth/login',{email,password}).pipe(tap(x=>this.save(x)))}
  register(model:RegisterModel){return this.http.post<AuthResponse>('/api/v1/auth/register',model).pipe(tap(x=>this.save(x)))}
  refresh(){const refreshToken=localStorage.getItem('refreshToken');return this.http.post<AuthResponse>('/api/v1/auth/refresh',{refreshToken}).pipe(tap(x=>this.save(x)))}
  logout(redirect=true){localStorage.removeItem('accessToken');localStorage.removeItem('refreshToken');localStorage.removeItem('accessExpiresAtUtc');this.token.set(null);if(redirect)this.router.navigateByUrl('/')}
  private save(x:AuthResponse){localStorage.setItem('accessToken',x.accessToken);localStorage.setItem('refreshToken',x.refreshToken);localStorage.setItem('accessExpiresAtUtc',x.expiresAtUtc);this.token.set(x.accessToken)}
}
