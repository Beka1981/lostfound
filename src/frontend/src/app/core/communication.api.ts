import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
export interface Profile {
  id: string;
  accountType: number;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  responsiblePerson?: string;
  email: string;
  phoneNumber?: string;
  profilePhotoUrl?: string;
  language: string;
  theme: string;
  notificationsEnabled: boolean;
  emailNotificationsEnabled: boolean;
  inAppNotificationsEnabled: boolean;
  allowContactSharing: boolean;
}
export interface Conversation {
  id: string;
  itemId?: string;
  itemTitle?: string;
  participants: { userId: string; displayName: string; photoUrl?: string }[];
  lastMessage?: string;
  lastMessageAtUtc?: string;
  unreadCount: number;
}
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderDisplayName: string;
  body: string;
  createdAtUtc: string;
}
@Injectable({ providedIn: 'root' })
export class CommunicationApi {
  constructor(private http: HttpClient) {}
  me() {
    return this.http.get<Profile>('/api/v1/profiles/me');
  }
  updateProfile(v: Profile) {
    return this.http.put<Profile>('/api/v1/profiles/me', v);
  }
  uploadPhoto(file: File) {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<{ url: string }>('/api/v1/profiles/me/photo', body);
  }
  removePhoto() {
    return this.http.delete<void>('/api/v1/profiles/me/photo');
  }
  changePassword(currentPassword: string, newPassword: string) {
    return this.http.post<void>('/api/v1/profiles/me/password', { currentPassword, newPassword });
  }
  publicProfile(id: string) {
    return this.http.get<any>(`/api/v1/profiles/${id}`);
  }
  conversations() {
    return this.http.get<Conversation[]>('/api/v1/conversations');
  }
  createConversation(itemId: string) {
    return this.http.post<Conversation>('/api/v1/conversations', null, { params: { itemId } });
  }
  messages(id: string) {
    return this.http.get<{ items: Message[] }>(`/api/v1/conversations/${id}/messages`);
  }
  readConversation(id:string){return this.http.post<void>(`/api/v1/conversations/${id}/read`,{});}
  send(id: string, body: string) {
    return this.http.post<Message>(`/api/v1/conversations/${id}/messages`, { body });
  }
  notifications() {
    return this.http.get<any>('/api/v1/notifications');
  }
  readAll() {
    return this.http.post<void>('/api/v1/notifications/read-all', {});
  }
  unreadCount() { return this.http.get<number>('/api/v1/notifications/unread-count'); }
  readNotification(id:string){return this.http.post<void>(`/api/v1/notifications/${id}/read`,{});}
  report(body: unknown) {
    return this.http.post('/api/v1/reports', body);
  }
  rate(exchangeId:string,score:number,review:string){return this.http.post('/api/v1/ratings',{exchangeId,score,review});}
  async connect(onMessage: (m: Message) => void, onNotification?:()=>void) {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/communication', {
        accessTokenFactory: () => localStorage.getItem('accessToken') || '',
      })
      .withAutomaticReconnect()
      .build();
    connection.on('messageReceived', onMessage);
    if(onNotification)connection.on('notificationReceived',onNotification);
    await connection.start();
    return connection;
  }
}
