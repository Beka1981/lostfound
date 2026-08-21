import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
export interface MatchSummary {
  id: string;
  lostItemId: string;
  foundItemId: string;
  lostTitle: string;
  foundTitle: string;
  matchScore: number;
  status: number;
  engineVersion: string;
  createdAtUtc: string;
}
@Injectable({ providedIn: 'root' })
export class Phase5Api {
  constructor(private http: HttpClient) {}
  matches(itemId?: string) {
    let p = new HttpParams();
    if (itemId) p = p.set('itemId', itemId);
    return this.http.get<{ items: MatchSummary[] }>('/api/v1/matches', { params: p });
  }
  match(id: string) {
    return this.http.get<any>(`/api/v1/matches/${id}`);
  }
  action(id: string, action: 'view' | 'dismiss' | 'confirm') {
    return this.http.post<void>(`/api/v1/matches/${id}/${action}`, {});
  }
  rescan(itemId: string) {
    return this.http.post(`/api/v1/matches/rescan/${itemId}`, {});
  }
  reports(status?: number) {
    let p = new HttpParams();
    if (status !== undefined) p = p.set('status', status);
    return this.http.get<any>('/api/v1/moderation/reports', { params: p });
  }
  transition(id: string, status: number, notes?: string) {
    return this.http.post<void>(`/api/v1/moderation/reports/${id}/transition`, {
      status,
      assignToMe: true,
      internalNotes: notes,
    });
  }
  audit() {
    return this.http.get<any[]>('/api/v1/moderation/audit');
  }
  moderateItem(id:string,operation:'hide'|'restore',reasonCode='policy',internalNotes=''){return this.http.post(`/api/v1/moderation/items/${id}/${operation}`,{reasonCode,internalNotes});}
  moderateUser(id:string,operation:'warn'|'suspend'|'reactivate'|'block',reasonCode='policy',internalNotes='',untilUtc?:string){return this.http.post(`/api/v1/moderation/users/${id}/${operation}`,{reasonCode,internalNotes,untilUtc});}
}
