// src/types.ts
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
  studentId?: string;
  affiliatedOrganizationId?: string;
  approved?: boolean;
  approvalRequested?: boolean;
  scheduledForDeletion?: boolean;
  deletionScheduledAt?: Date | null;
  deletionDate?: Date | null;
  isActive?: boolean;
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
  adminUsers: string[];
  affiliatedStudents: string[];
}

export interface AffiliationRequest {
  id: string;
  studentUid: string;
  studentName: string;
  studentEmail: string;
  studentId?: string;
  organizationId: string;
  organizationName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
}

export interface EventCreationRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  organizationId?: string;       // note: use this to tie to organization
  organizationName?: string;
  eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
}

export type EventStatus = 'draft' | 'pending_approval' | 'published' | 'finished' | 'rejected';

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
  organiser_org_id: string; // keep this property on Event (organiser id)
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
  eventName: string;
  user?: User;
}

export interface ChatMessage {
  id: string;
  eventId: string;
  senderUid: string;
  senderName: string;
  role: UserRole;
  content: string;
  image?: string; 
  timestamp: Date;
  edited?: boolean;
  editedAt?: Date;
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

export interface UserApprovalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  requestedRole: 'school' | 'firm' | 'university';
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reason?: string;
  organizationInfo?: {
    name?: string;
    address?: string;
    phone?: string;
    description?: string;
  };
}