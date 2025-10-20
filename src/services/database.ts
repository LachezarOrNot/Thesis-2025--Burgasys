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
  
  // Safe date conversion utility
  private safeDateConvert(date: any): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    if (date.toDate && typeof date.toDate === 'function') return date.toDate();
    try {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch {
      return new Date();
    }
  }

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
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          createdAt: this.safeDateConvert(data.createdAt),
          updatedAt: this.safeDateConvert(data.updatedAt)
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
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
    try {
      const orgRef = doc(db, 'organizations', orgId);
      const orgSnap = await getDoc(orgRef);
      
      if (orgSnap.exists()) {
        const data = orgSnap.data();
        return {
          ...data,
          createdAt: this.safeDateConvert(data.createdAt),
          updatedAt: this.safeDateConvert(data.updatedAt)
        } as Organization;
      }
      return null;
    } catch (error) {
      console.error('Error getting organization:', error);
      return null;
    }
  }

  async getOrganizations(): Promise<Organization[]> {
    try {
      const orgsQuery = query(collection(db, 'organizations'));
      const orgsSnap = await getDocs(orgsQuery);
      
      return orgsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: this.safeDateConvert(data.createdAt),
          updatedAt: this.safeDateConvert(data.updatedAt)
        } as Organization;
      });
    } catch (error) {
      console.error('Error getting organizations:', error);
      return [];
    }
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
    try {
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
      return requestsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          requestedAt: this.safeDateConvert(data.requestedAt)
        } as AffiliationRequest;
      });
    } catch (error) {
      console.error('Error getting affiliation requests:', error);
      return [];
    }
  }

  async updateAffiliationRequest(requestId: string, updates: Partial<AffiliationRequest>): Promise<void> {
    const requestRef = doc(db, 'affiliationRequests', requestId);
    await updateDoc(requestRef, updates);
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      const eventId = uuidv4();
      const eventRef = doc(db, 'events', eventId);

      // Convert empty capacity to undefined (not null)
      const capacityValue = eventData.capacity === null || eventData.capacity === undefined 
        ? undefined 
        : Number(eventData.capacity);

      // Ensure all required fields with proper defaults
      const event: Event = {
        id: eventId,
        name: eventData.name || '',
        subtitle: eventData.subtitle || '',
        description: eventData.description || '',
        location: eventData.location || '',
        lat: eventData.lat || 0,
        lng: eventData.lng || 0,
        start_datetime: this.safeDateConvert(eventData.start_datetime),
        end_datetime: this.safeDateConvert(eventData.end_datetime),
        capacity: capacityValue, // Use undefined for empty values
        tags: eventData.tags || [],
        images: eventData.images || [],
        organiser_org_id: eventData.organiser_org_id || '',
        createdBy: eventData.createdBy || '',
        status: eventData.status || 'published',
        allow_registration: eventData.allow_registration ?? true,
        registeredUsers: eventData.registeredUsers || [],
        waitlist: eventData.waitlist || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(eventRef, event);
      return event;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const data = eventSnap.data();
        return {
          ...data,
          start_datetime: this.safeDateConvert(data.start_datetime),
          end_datetime: this.safeDateConvert(data.end_datetime),
          createdAt: this.safeDateConvert(data.createdAt),
          updatedAt: this.safeDateConvert(data.updatedAt)
        } as Event;
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      return null;
    }
  }

  async getEvents(filters?: {
    status?: EventStatus;
    organiser_org_id?: string;
    search?: string;
    tags?: string[];
  }): Promise<Event[]> {
    try {
      let eventsQuery = query(collection(db, 'events'));
      
      if (filters?.status) {
        eventsQuery = query(eventsQuery, where('status', '==', filters.status));
      }
      
      if (filters?.organiser_org_id) {
        eventsQuery = query(eventsQuery, where('organiser_org_id', '==', filters.organiser_org_id));
      }
      
      const eventsSnap = await getDocs(eventsQuery);
      let events = eventsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          start_datetime: this.safeDateConvert(data.start_datetime),
          end_datetime: this.safeDateConvert(data.end_datetime),
          createdAt: this.safeDateConvert(data.createdAt),
          updatedAt: this.safeDateConvert(data.updatedAt)
        } as Event;
      });
      
      // Apply client-side filters
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        events = events.filter(event => 
          event.name?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
          event.location?.toLowerCase().includes(searchLower)
        );
      }
      
      if (filters?.tags && filters.tags.length > 0) {
        events = events.filter(event =>
          event.tags && filters.tags!.some(tag => event.tags.includes(tag))
        );
      }
      
      // Safe sorting
      return events.sort((a, b) => {
        try {
          return this.safeDateConvert(a.start_datetime).getTime() - this.safeDateConvert(b.start_datetime).getTime();
        } catch {
          return 0;
        }
      });
    } catch (error) {
      console.error('Error getting events:', error);
      return [];
    }
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<void> {
    const eventRef = doc(db, 'events', eventId);
    
    // Handle capacity conversion if it's being updated
    const processedUpdates = { ...updates };
    if ('capacity' in processedUpdates) {
      processedUpdates.capacity = processedUpdates.capacity === null || processedUpdates.capacity === undefined 
        ? undefined 
        : Number(processedUpdates.capacity);
    }
    
    await updateDoc(eventRef, {
      ...processedUpdates,
      updatedAt: new Date()
    });
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, 'events', eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  }

  async registerForEvent(eventId: string, userUid: string): Promise<EventRegistration> {
    try {
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
      
      // Update event's registered users
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        registeredUsers: [...(event.registeredUsers || []), userUid]
      });
      
      return registration;
    } catch (error) {
      console.error('Error registering for event:', error);
      throw error;
    }
  }

  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    try {
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId)
      );
      
      const registrationsSnap = await getDocs(registrationsQuery);
      return registrationsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          registeredAt: this.safeDateConvert(data.registeredAt)
        } as EventRegistration;
      });
    } catch (error) {
      console.error('Error getting event registrations:', error);
      return [];
    }
  }

  async getUserEventRegistration(eventId: string, userUid: string): Promise<EventRegistration | null> {
    try {
      const registrationQuery = query(
        collection(db, 'eventRegistrations'),
        where('eventId', '==', eventId),
        where('userUid', '==', userUid)
      );
      
      const registrationSnap = await getDocs(registrationQuery);
      if (registrationSnap.empty) return null;
      
      const data = registrationSnap.docs[0].data();
      return {
        ...data,
        registeredAt: this.safeDateConvert(data.registeredAt)
      } as EventRegistration;
    } catch (error) {
      console.error('Error getting user registration:', error);
      return null;
    }
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
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          timestamp: this.safeDateConvert(data.timestamp)
        } as ChatMessage;
      });
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
    try {
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const notificationsSnap = await getDocs(notificationsQuery);
      return notificationsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          createdAt: this.safeDateConvert(data.createdAt)
        } as Notification;
      });
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  }

  async uploadFile(file: File, path: string): Promise<string> {
    try {
      const { storage, ref, uploadBytes, getDownloadURL } = await import('./firebase');
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const { storage, ref, deleteObject } = await import('./firebase');
      const fileRef = ref(storage, url);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();