import { TestBed } from '@angular/core/testing';
import { HttpClient,provideHttpClient,withInterceptors } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { authInterceptor } from '../app.config';
import { safeMatchExplanation } from '../pages/phase5.pages';

describe('production client security smoke tests',()=>{
 afterEach(()=>localStorage.clear());
 it('redirects unauthenticated protected navigation to login with return URL',()=>{const tree={redirect:true};const router={createUrlTree:vi.fn(()=>tree)};TestBed.configureTestingModule({providers:[{provide:Router,useValue:router}]});const result=TestBed.runInInjectionContext(()=>authGuard({} as any,{url:'/matches'} as any));expect(result).toBe(tree);expect(router.createUrlTree).toHaveBeenCalledWith(['/login'],{queryParams:{returnUrl:'/matches'}})});
 it('adds the bearer token without changing the API origin',()=>{localStorage.setItem('accessToken','test-token');TestBed.configureTestingModule({providers:[provideHttpClient(withInterceptors([authInterceptor])),provideHttpClientTesting()]});const client=TestBed.inject(HttpClient);const controller=TestBed.inject(HttpTestingController);client.get('/api/v1/matches').subscribe();const request=controller.expectOne('/api/v1/matches');expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');request.flush({});controller.verify()});
 it('drops private explanation keys before rendering',()=>{const safe=safeMatchExplanation([{key:'category',score:25,weight:25},{key:'answerCiphertext',detail:'private'},{key:'codeHash',detail:'private'}]);expect(safe).toEqual([{key:'category',score:25,weight:25}])});
});
