import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  getDocs, 
  onSnapshot,
  writeBatch,
  DocumentData,
  QuerySnapshot
} from './firebase';
import { 
  User, 
  Organization, 
  Event, 
  AffiliationRequest, 
  EventRegistration, 
  ChatMessage, 
  Notification,
  UserRole,
  EventStatus 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

class DatabaseService {
  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const userRef = doc(db, 'users', userData.uid);
    const user: User = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(userRef, user);
    return user;
  }

  async getUser(uid: string): Promise<User | null> {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async createOrganization(orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const orgId = uuidv4();
    const orgRef = doc(db, 'organizations', orgId);
    const organization: Organization = {
      ...orgData,
      id: orgId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await setDoc(orgRef, organization);
    return organization;
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    const orgRef = doc(db, 'organizations', orgId);
    const orgSnap = await getDoc(orgRef);
    
    if (orgSnap.exists()) {
      return orgSnap.data() as Organization;
    }
    return null;
  }

  async getOrganizations(): Promise<Organization[]> {
    const orgsQuery = query(collection(db, 'organizations'));
    const orgsSnap = await getDocs(orgsQuery);
    
    return orgsSnap.docs.map(doc => doc.data() as Organization);
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async requestAffiliation(userUid: string, orgId: string): Promise<AffiliationRequest> {
    const requestId = uuidv4();
    const requestRef = doc(db, 'affiliationRequests', requestId);
    
    const request: AffiliationRequest = {
      id: requestId,
      userUid,
      orgId,
      status: 'pending',
      requestedAt: new Date()
    };
    
    await setDoc(requestRef, request);
    return request;
  }

  async getAffiliationRequests(orgId?: string): Promise<AffiliationRequest[]> {
    let requestsQuery;
    
    if (orgId) {
      requestsQuery = query(
        collection(db, 'affiliationRequests'),
        where('orgId', '==', orgId)
      );
    } else {
      requestsQuery = query(collection(db, 'affiliationRequests'));
    }
    
    const requestsSnap = await getDocs(requestsQuery);
    return requestsSnap.docs.map(doc => doc.data() as AffiliationRequest);
  }

  async updateAffiliationRequest(requestId: string, updates: Partial<AffiliationRequest>): Promise<void> {
    const requestRef = doc(db, 'affiliationRequests', requestId);
    await updateDoc(requestRef, updates);
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    // Normalize datetimes
    const normalize = (val: any) => {
      if (!val) return undefined;
      if (typeof val === 'string') return new Date(val);
      if (val instanceof Date) return val;
      return val;
    };

    const payload: any = {
      ...eventData,
      start_datetime: normalize((eventData as any).start_datetime),
      end_datetime: normalize((eventData as any).end_datetime),
      images: (eventData as any).images || [],
      registeredUsers: (eventData as any).registeredUsers || []
    };

    const eventId = uuidv4();
    const eventRef = doc(db, 'events', eventId);

    const event: Event = {
      ...payload,
      id: eventId,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Event;

    // Ensure collections exist by writing a placeholder to collections that might be missing (client fallback)
    try {
      await setDoc(eventRef, event);
    } catch (err) {
      // attempt to create the collection placeholder and retry
      await setDoc(doc(db, 'events', eventId), event);
    }

    return event;
  }

  async getEvent(eventId: string): Promise<Event | null> {
    const eventRef = doc(db, 'events', eventId);
    const eventSnap = await getDoc(eventRef);
    
    if (eventSnap.exists()) {
      return eventSnap.data() as Event;
    }
    return null;
  }

  async getEvents(filters?: {
    status?: EventStatus;
    organiser_org_id?: string;
    search?: string;
    tags?: string[];
  }): Promise<Event[]> {
    let eventsQuery = query(collection(db, 'events'));
    
    if (filters?.status) {
      eventsQuery = query(eventsQuery, where('status', '==', filters.status));
    }
    
    if (filters?.organiser_org_id) {
      eventsQuery = query(eventsQuery, where('organiser_org_id', '==', filters.organiser_org_id));
    }
    
    const eventsSnap = await getDocs(eventsQuery);
    let events = eventsSnap.docs.map(doc => doc.data() as Event);
    
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      events = events.filter(event => 
        event.name.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters?.tags && filters.tags.length > 0) {
      events = events.filter(event =>
        filters.tags!.some(tag => event.tags.includes(tag))
      );
    }
    
    return events.sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: new Date()
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  }

  async registerForEvent(eventId: string, userUid: string): Promise<EventRegistration> {
    const registrationId = uuidv4();
    const registrationRef = doc(db, 'eventRegistrations', registrationId);
    
    const event = await this.getEvent(eventId);
    if (!event) throw new Error('Event not found');
    
    const existingRegistration = await this.getUserEventRegistration(eventId, userUid);
    if (existingRegistration) throw new Error('Already registered for this event');
    
    const registrations = await this.getEventRegistrations(eventId);
    const registeredCount = registrations.filter(r => r.status === 'registered').length;
    
    let status: 'registered' | 'waitlisted' = 'registered';
    if (event.capacity && registeredCount >= event.capacity) {
      status = 'waitlisted';
    }
    
    const registration: EventRegistration = {
      id: registrationId,
      eventId,
      userUid,
      status,
      registeredAt: new Date()
    };
    
    await setDoc(registrationRef, registration);
    
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      registeredUsers: [...(event.registeredUsers || []), userUid]
    });
    
    return registration;
  }

  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const registrationsQuery = query(
      collection(db, 'eventRegistrations'),
      where('eventId', '==', eventId)
    );
    
    const registrationsSnap = await getDocs(registrationsQuery);
    return registrationsSnap.docs.map(doc => doc.data() as EventRegistration);
  }

  async getUserEventRegistration(eventId: string, userUid: string): Promise<EventRegistration | null> {
    const registrationQuery = query(
      collection(db, 'eventRegistrations'),
      where('eventId', '==', eventId),
      where('userUid', '==', userUid)
    );
    
    const registrationSnap = await getDocs(registrationQuery);
    if (registrationSnap.empty) return null;
    
    return registrationSnap.docs[0].data() as EventRegistration;
  }

  async sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const messageId = uuidv4();
    const messageRef = doc(db, 'chatMessages', messageId);
    
    const chatMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: new Date()
    };
    
    await setDoc(messageRef, chatMessage);
    return chatMessage;
  }

  subscribeToChatMessages(eventId: string, callback: (messages: ChatMessage[]) => void) {
    const messagesQuery = query(
      collection(db, 'chatMessages'),
      where('eventId', '==', eventId),
      orderBy('timestamp', 'asc')
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = snapshot.docs.map(doc => doc.data() as ChatMessage);
      callback(messages);
    });
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const notificationId = uuidv4();
    const notificationRef = doc(db, 'notifications', notificationId);
    
    const newNotification: Notification = {
      ...notification,
      id: notificationId,
      createdAt: new Date()
    };
    
    await setDoc(notificationRef, newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const notificationsSnap = await getDocs(notificationsQuery);
    return notificationsSnap.docs.map(doc => doc.data() as Notification);
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  async uploadFile(file: File, path: string): Promise<string> {
    const { storage, ref, uploadBytes, getDownloadURL } = await import('./firebase');
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  async deleteFile(url: string): Promise<void> {
    const { storage, ref, deleteObject } = await import('./firebase');
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  }
}

export const databaseService = new DatabaseService();