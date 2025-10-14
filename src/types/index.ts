export type UserRole = 'admin' | 'school' | 'firm' | 'user' | 'student' | 'university';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  phoneNumber?: string;
  affiliations?: string[];
  bio?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: 'school' | 'firm' | 'university';
  address: string;
  phone: string;
  email: string;
  description?: string;
  verified: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  logoURL?: string;
}

export interface AffiliationRequest {
  id: string;
  userUid: string;
  orgId: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: Date;
  acceptedBy?: string;
  user?: User;
  organization?: Organization;
}

export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'finished' | 'archived';

export interface Event {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  images: string[];
  location: string;
  lat: number;
  lng: number;
  start_datetime: Date;
  end_datetime: Date;
  capacity?: number;
  tags: string[];
  organiser_org_id: string;
  createdBy: string;
  status: EventStatus;
  allow_registration: boolean;
  createdAt: Date;
  updatedAt: Date;
  organization?: Organization;
  registeredUsers?: string[];
  waitlist?: string[];
  finalReport?: string;
  eventPhotos?: string[];
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userUid: string;
  registeredAt: Date;
  status: 'registered' | 'waitlisted';
  user?: User;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  senderUid: string;
  senderName: string;
  role: UserRole;
  content: string;
  timestamp: Date;
  flagged?: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}