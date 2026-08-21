import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (_, state) => {
  if (localStorage.getItem('accessToken')) return true;
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
export const moderatorGuard:CanActivateFn=(_,state)=>{const token=localStorage.getItem('accessToken');if(!token)return inject(Router).createUrlTree(['/login'],{queryParams:{returnUrl:state.url}});try{const body=JSON.parse(atob(token.split('.')[1]));const roles=body['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']||body.role||[];if((Array.isArray(roles)?roles:[roles]).some(x=>x==='Moderator'||x==='Admin'))return true}catch{}return inject(Router).createUrlTree(['/not-found'])};
