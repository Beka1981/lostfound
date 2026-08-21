import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}
export interface ClaimSummary {
  id: string;
  itemId: string;
  itemTitle: string;
  claimantId: string;
  status: number;
  createdAtUtc: string;
  reviewedAtUtc?: string;
  exchangeId?: string;
}
export interface Question {
  id: string;
  prompt: string;
  sortOrder: number;
}
export interface ClaimDetail extends ClaimSummary {
  itemOwnerId: string;
  questions: Question[];
  answers?: { questionId: string; question: string; answer: string }[];
}
export interface Exchange {
  id: string;
  claimId: string;
  itemId: string;
  ownerId: string;
  claimantId: string;
  status: number;
  expiresAtUtc?: string;
  failedAttempts: number;
  lockedUntilUtc?: string;
  completedAtUtc?: string;
  canGenerateCode: boolean;
  canEnterCode: boolean;
  canRate: boolean;
}
export interface QrTag {
  id: string;
  label: string;
  description?: string;
  itemId?: string;
  isActive: boolean;
  isRevoked: boolean;
  createdAtUtc: string;
  scanCount: number;
}
@Injectable({ providedIn: 'root' })
export class OwnershipApi {
  private http = inject(HttpClient);
  private root = '/api/v1';
  questions(itemId: string) {
    return this.http.get<Question[]>(`${this.root}/items/${itemId}/verification-questions`);
  }
  createClaim(itemId: string, answers: { questionId: string; answer: string }[]) {
    return this.http.post<ClaimDetail>(`${this.root}/claims/items/${itemId}`, { answers });
  }
  claims(received = false) {
    return this.http.get<Page<ClaimSummary>>(
      `${this.root}/claims/${received ? 'received' : 'mine'}`,
    );
  }
  claim(id: string) {
    return this.http.get<ClaimDetail>(`${this.root}/claims/${id}`);
  }
  review(id: string, accept: boolean) {
    return this.http.post<void>(`${this.root}/claims/${id}/review`, { accept });
  }
  cancel(id: string) {
    return this.http.post<void>(`${this.root}/claims/${id}/cancel`, {});
  }
  exchanges() {
    return this.http.get<Exchange[]>(`${this.root}/exchanges`);
  }
  exchange(id: string) {
    return this.http.get<Exchange>(`${this.root}/exchanges/${id}`);
  }
  code(id: string) {
    return this.http.post<{ code: string; expiresAtUtc: string }>(
      `${this.root}/exchanges/${id}/code`,
      {},
    );
  }
  verify(id: string, code: string) {
    return this.http.post<Exchange>(`${this.root}/exchanges/${id}/verify`, { code });
  }
  qrTags() {
    return this.http.get<QrTag[]>(`${this.root}/qr-tags`);
  }
  createQr(body: { label: string; description?: string; itemId?: string }) {
    return this.http.post<{ id: string; token: string; publicUrl: string }>(
      `${this.root}/qr-tags`,
      body,
    );
  }
  qrState(id: string, isActive: boolean) {
    return this.http.put<void>(`${this.root}/qr-tags/${id}/state`, { isActive });
  }
  rotate(id: string) {
    return this.http.post<{ token: string; publicUrl: string }>(
      `${this.root}/qr-tags/${id}/rotate`,
      {},
    );
  }
  renderQr(id: string, token: string, format: 'svg' | 'png') {
    return this.http.post(`${this.root}/qr-tags/${id}/render?format=${format}`, { token }, { responseType: 'blob' });
  }
  revoke(id: string) {
    return this.http.post<void>(`${this.root}/qr-tags/${id}/revoke`, {});
  }
  scans(id: string) {
    return this.http.get<any[]>(`${this.root}/qr-tags/${id}/scans`);
  }
  publicQr(token: string) {
    return this.http.get<{ label: string; description?: string; canContact: boolean }>(
      `${this.root}/qr/${token}`,
    );
  }
  contact(token: string, message: string, coarseLocation?: string) {
    return this.http.post(`${this.root}/qr/${token}/contact`, { message, coarseLocation });
  }
}
