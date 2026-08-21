import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
export interface Item {
  id: string;
  canManage: boolean;
  type: 0 | 1;
  status: number;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  occurredAtUtc: string;
  brand?: string;
  color?: string;
  rewardAmount?: number;
  viewCount: number;
  createdAtUtc: string;
  photos: { id: string; url: string; sortOrder: number }[];
  attributes: Record<string, string>;
  isFavorite: boolean;
}
export interface Category {
  id: string;
  slug: string;
  nameKey: string;
  subcategories: { id: string; slug: string; nameKey: string }[];
}
export interface ItemStatistics {
  lost: number;
  found: number;
  returned: number;
}
export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}
@Injectable({ providedIn: 'root' })
export class ItemsApi {
  constructor(private http: HttpClient) {}
  private params(filters: Record<string, string>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params = params.set(k, v);
    });
    return params;
  }
  search(filters: Record<string, string> = {}) {
    return this.http.get<Page<Item>>('/api/v1/items', { params: this.params(filters) });
  }
  mine(filters: Record<string, string> = {}) {
    return this.http.get<Page<Item>>('/api/v1/items/mine', { params: this.params(filters) });
  }
  get(id: string) {
    return this.http.get<Item>(`/api/v1/items/${id}`);
  }
  poster(id:string){return this.http.get<{displayName:string;photoUrl?:string;rating?:number;ratingCount:number;successfulReturns:number;contactSharingEnabled:boolean}>(`/api/v1/items/${id}/poster`);}
  categories() {
    return this.http.get<Category[]>('/api/v1/categories');
  }
  statistics() {
    return this.http.get<ItemStatistics>('/api/v1/items/statistics');
  }
  create(body: unknown) {
    return this.http.post<Item>('/api/v1/items', body);
  }
  update(id: string, body: unknown) {
    return this.http.put<Item>(`/api/v1/items/${id}`, body);
  }
  remove(id: string) {
    return this.http.delete<void>(`/api/v1/items/${id}`);
  }
  upload(id: string, file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ id: string; url: string; sortOrder: number }>(
      `/api/v1/items/${id}/photos`,
      body,
    );
  }
  removePhoto(itemId:string,photoId:string){return this.http.delete<void>(`/api/v1/items/${itemId}/photos/${photoId}`);}
  favorite(id: string) {
    return this.http.post<void>(`/api/v1/favorites/${id}`, {});
  }
  unfavorite(id: string) {
    return this.http.delete<void>(`/api/v1/favorites/${id}`);
  }
  favorites() {
    return this.http.get<string[]>('/api/v1/favorites');
  }
}
