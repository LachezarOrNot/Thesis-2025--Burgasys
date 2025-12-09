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
  EventStatus,
  EventCreationRequest,
   UserApprovalRequest 
} from '../types';
import { v4 as uuidv4 } from 'uuid';

class DatabaseService {
  
 // FIXED: Safe date conversion utility
private safeDateConvert(date: any): Date {
  // Return current date only if date is null/undefined
  if (date == null) return new Date();
  
  // If it's already a Date object, return it directly
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? new Date() : date;
  }
  
  // If it's a Firestore timestamp with toDate method, convert it
  if (date.toDate && typeof date.toDate === 'function') {
    return date.toDate();
  }

  if (typeof date === 'object' && typeof date.seconds === 'number') {
  console.log('🔍 Converting seconds:', date.seconds);
  const converted = new Date(date.seconds * 1000);
  console.log('🔍 Converted date object:', converted);
  console.log('🔍 Time:', converted.getHours(), ':', converted.getMinutes());
  return converted;
}
  
  // ✅ CRITICAL FIX: Handle serialized Firestore Timestamp (object with seconds)
  if (typeof date === 'object' && typeof date.seconds === 'number') {
    console.log('Converting Firestore timestamp:', date.seconds);
    const converted = new Date(date.seconds * 1000);
    console.log('Converted to:', converted);
    return converted;
  }
  
  // For strings or numbers, try to parse
  if (typeof date === 'string' || typeof date === 'number') {
    try {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    } catch {
      console.warn('Failed to parse date:', date);
      return new Date();
    }
  }
  
  // If we get here, it's an unrecognized format
  console.warn('Unrecognized date format, returning current date:', date);
  return new Date();
}

  // Helper function to remove undefined values for Firestore by converting them to null
  private prepareDataForFirestore(data: any): any {
    if (data === undefined) return null;
    if (data === null) return null;
    
    if (Array.isArray(data)) {
      return data.map(item => this.prepareDataForFirestore(item));
    }
    
    if (data && typeof data === 'object' && !(data instanceof Date)) {
      const cleaned: any = {};
      Object.keys(data).forEach(key => {
        const value = this.prepareDataForFirestore(data[key]);
        cleaned[key] = value;
      });
      return cleaned;
    }
    
    return data;
  }

  // Helper function to convert Firestore data back to our TypeScript types
  private convertFromFirestore(data: any): any {
    if (data === null) return undefined;
    
    if (Array.isArray(data)) {
      return data.map(item => this.convertFromFirestore(item));
    }
    
    if (data && typeof data === 'object' && !(data instanceof Date)) {
      const converted: any = {};
      Object.keys(data).forEach(key => {
        const value = this.convertFromFirestore(data[key]);
        converted[key] = value;
      });
      return converted;
    }
    
    return data;
  }

  async createUser(userData: Omit<User, 'createdAt' | 'updatedAt'>): Promise<User> {
    const userRef = doc(db, 'users', userData.uid);
    const user: User = {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const preparedUser = this.prepareDataForFirestore(user);
    await setDoc(userRef, preparedUser);
    return user;
  }

  async getUser(uid: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          createdAt: this.safeDateConvert(convertedData.createdAt),
          updatedAt: this.safeDateConvert(convertedData.updatedAt)
        } as User;
      }
      return null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnap = await getDocs(usersQuery);
      
      return usersSnap.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          createdAt: this.safeDateConvert(convertedData.createdAt),
          updatedAt: this.safeDateConvert(convertedData.updatedAt)
        } as User;
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const preparedUpdates = this.prepareDataForFirestore({
      ...updates,
      updatedAt: new Date()
    });
    await updateDoc(userRef, preparedUpdates);
  }

  // User Approval Requests
  async createUserApprovalRequest(request: Omit<UserApprovalRequest, 'id' | 'submittedAt'>): Promise<UserApprovalRequest> {
    const requestId = uuidv4();
    const requestRef = doc(db, 'userApprovalRequests', requestId);
    
    const approvalRequest: UserApprovalRequest = {
      ...request,
      id: requestId,
      submittedAt: new Date()
    };
    
    const preparedRequest = this.prepareDataForFirestore(approvalRequest);
    await setDoc(requestRef, preparedRequest);
    return approvalRequest;
  }

  async getUserApprovalRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<UserApprovalRequest[]> {
    try {
      let requestsQuery;
      
      if (status) {
        requestsQuery = query(
          collection(db, 'userApprovalRequests'),
          where('status', '==', status)
        );
      } else {
        requestsQuery = query(collection(db, 'userApprovalRequests'));
      }
      
      const requestsSnap = await getDocs(requestsQuery);
      return requestsSnap.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          submittedAt: this.safeDateConvert(convertedData.submittedAt),
          reviewedAt: convertedData.reviewedAt ? this.safeDateConvert(convertedData.reviewedAt) : undefined
        } as UserApprovalRequest;
      });
    } catch (error) {
      console.error('Error getting user approval requests:', error);
      return [];
    }
  }

  async updateUserApprovalRequest(requestId: string, updates: Partial<UserApprovalRequest>): Promise<void> {
    const requestRef = doc(db, 'userApprovalRequests', requestId);
    
    if (updates.status === 'approved') {
      // Get the request to update the user
      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const request = requestDoc.data() as UserApprovalRequest;
        
        // Update user's approved status
        await this.updateUser(request.userId, {
          approved: true,
          approvalRequested: false
        });
      }
    } else if (updates.status === 'rejected') {
      // Get the request to update the user
      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const request = requestDoc.data() as UserApprovalRequest;
        
        // Update user's approval status
        await this.updateUser(request.userId, {
          approved: false,
          approvalRequested: false
        });
      }
    }
    
    const preparedUpdates = this.prepareDataForFirestore({
      ...updates,
      reviewedAt: updates.status !== 'pending' ? new Date() : undefined
    });
    
    await updateDoc(requestRef, preparedUpdates);
  }

  

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      );
      
      const userSnap = await getDocs(userQuery);
      if (userSnap.empty) return null;
      
      const data = userSnap.docs[0].data();
      const convertedData = this.convertFromFirestore(data);
      return {
        ...convertedData,
        createdAt: this.safeDateConvert(convertedData.createdAt),
        updatedAt: this.safeDateConvert(convertedData.updatedAt)
      } as User;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
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
    
    const preparedOrg = this.prepareDataForFirestore(organization);
    await setDoc(orgRef, preparedOrg);
    return organization;
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    try {
      const orgRef = doc(db, 'organizations', orgId);
      const orgSnap = await getDoc(orgRef);
      
      if (orgSnap.exists()) {
        const data = orgSnap.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          createdAt: this.safeDateConvert(convertedData.createdAt),
          updatedAt: this.safeDateConvert(convertedData.updatedAt)
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
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          createdAt: this.safeDateConvert(convertedData.createdAt),
          updatedAt: this.safeDateConvert(convertedData.updatedAt)
        } as Organization;
      });
    } catch (error) {
      console.error('Error getting organizations:', error);
      return [];
    }
  }

  async updateOrganization(orgId: string, updates: Partial<Organization>): Promise<void> {
    const orgRef = doc(db, 'organizations', orgId);
    const preparedUpdates = this.prepareDataForFirestore({
      ...updates,
      updatedAt: new Date()
    });
    await updateDoc(orgRef, preparedUpdates);
  }

  async requestAffiliation(studentUid: string, orgId: string, studentId?: string): Promise<AffiliationRequest> {
    const requestId = uuidv4();
    const requestRef = doc(db, 'affiliationRequests', requestId);
    
    // Get student and organization details
    const [student, organization] = await Promise.all([
      this.getUser(studentUid),
      this.getOrganization(orgId)
    ]);
    
    if (!student || student.role !== 'student') {
      throw new Error('Only students can request affiliation');
    }
    
    if (!organization) {
      throw new Error('Organization not found');
    }
    
    const request: AffiliationRequest = {
      id: requestId,
      studentUid: studentUid,
      studentName: student.displayName,
      studentEmail: student.email,
      studentId: studentId,
      organizationId: orgId,
      organizationName: organization.name,
      status: 'pending',
      requestedAt: new Date()
    };
    
    const preparedRequest = this.prepareDataForFirestore(request);
    await setDoc(requestRef, preparedRequest);
    return request;
  }

  async getStudentAffiliationRequests(studentUid: string): Promise<AffiliationRequest[]> {
    try {
      const requestsQuery = query(
        collection(db, 'affiliationRequests'),
        where('studentUid', '==', studentUid)
      );
      
      const requestsSnap = await getDocs(requestsQuery);
      return requestsSnap.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          requestedAt: this.safeDateConvert(convertedData.requestedAt),
          reviewedAt: convertedData.reviewedAt ? this.safeDateConvert(convertedData.reviewedAt) : undefined
        } as AffiliationRequest;
      });
    } catch (error) {
      console.error('Error getting student affiliation requests:', error);
      return [];
    }
  }

  async getAffiliationRequests(orgId?: string): Promise<AffiliationRequest[]> {
    try {
      let requestsQuery;
      
      if (orgId) {
        requestsQuery = query(
          collection(db, 'affiliationRequests'),
          where('organizationId', '==', orgId)
        );
      } else {
        requestsQuery = query(collection(db, 'affiliationRequests'));
      }
      
      const requestsSnap = await getDocs(requestsQuery);
      return requestsSnap.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          requestedAt: this.safeDateConvert(convertedData.requestedAt),
          reviewedAt: convertedData.reviewedAt ? this.safeDateConvert(convertedData.reviewedAt) : undefined
        } as AffiliationRequest;
      });
    } catch (error) {
      console.error('Error getting affiliation requests:', error);
      return [];
    }
  }

  async updateAffiliationRequest(requestId: string, updates: Partial<AffiliationRequest>): Promise<void> {
    const requestRef = doc(db, 'affiliationRequests', requestId);
    
    if (updates.status === 'approved') {
      // Get the request to update student and organization
      const requestDoc = await getDoc(requestRef);
      if (requestDoc.exists()) {
        const request = requestDoc.data() as AffiliationRequest;
        
        // Update student's affiliated organization
        await this.updateUser(request.studentUid, {
          affiliatedOrganizationId: request.organizationId
        });
        
        // Add student to organization's affiliated students
        const org = await this.getOrganization(request.organizationId);
        if (org) {
          await this.updateOrganization(request.organizationId, {
            affiliatedStudents: [...(org.affiliatedStudents || []), request.studentUid]
          });
        }
      }
    }
    
    const preparedUpdates = this.prepareDataForFirestore({
      ...updates,
      reviewedAt: updates.status !== 'pending' ? new Date() : undefined
    });
    
    await updateDoc(requestRef, preparedUpdates);
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    try {
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('adminUsers', 'array-contains', userId)
      );
      
      const orgsSnap = await getDocs(orgsQuery);
      return orgsSnap.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          createdAt: this.safeDateConvert(convertedData.createdAt),
          updatedAt: this.safeDateConvert(convertedData.updatedAt)
        } as Organization;
      });
    } catch (error) {
      console.error('Error getting user organizations:', error);
      return [];
    }
  }

  async getStudentOrganization(studentUid: string): Promise<Organization | null> {
    try {
      const student = await this.getUser(studentUid);
      if (!student || !student.affiliatedOrganizationId) {
        return null;
      }
      
      return await this.getOrganization(student.affiliatedOrganizationId);
    } catch (error) {
      console.error('Error getting student organization:', error);
      return null;
    }
  }

  async createEventRequest(request: Omit<EventCreationRequest, 'id' | 'submittedAt'>): Promise<EventCreationRequest> {
    const requestId = uuidv4();
    const requestRef = doc(db, 'eventCreationRequests', requestId);
    
    const eventRequest: EventCreationRequest = {
      ...request,
      id: requestId,
      submittedAt: new Date()
    };
    
    const preparedRequest = this.prepareDataForFirestore(eventRequest);
    await setDoc(requestRef, preparedRequest);
    return eventRequest;
  }

  async getEventRequests(status?: 'pending' | 'approved' | 'rejected'): Promise<EventCreationRequest[]> {
    try {
      let requestsQuery;
      
      if (status) {
        requestsQuery = query(
          collection(db, 'eventCreationRequests'),
          where('status', '==', status)
        );
      } else {
        requestsQuery = query(collection(db, 'eventCreationRequests'));
      }
      
      const requestsSnap = await getDocs(requestsQuery);
      return requestsSnap.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          submittedAt: this.safeDateConvert(convertedData.submittedAt),
          reviewedAt: convertedData.reviewedAt ? this.safeDateConvert(convertedData.reviewedAt) : undefined
        } as EventCreationRequest;
      });
    } catch (error) {
      console.error('Error getting event requests:', error);
      return [];
    }
  }

  async updateEventRequest(requestId: string, updates: Partial<EventCreationRequest>): Promise<void> {
    const requestRef = doc(db, 'eventCreationRequests', requestId);
    const preparedUpdates = this.prepareDataForFirestore({
      ...updates,
      reviewedAt: updates.status !== 'pending' ? new Date() : undefined
    });
    await updateDoc(requestRef, preparedUpdates);
  }

  async deleteEventRequest(requestId: string): Promise<void> {
    try {
      const requestRef = doc(db, 'eventCreationRequests', requestId);
      await deleteDoc(requestRef);
    } catch (error) {
      console.error('Error deleting event request:', error);
      throw error;
    }
  }

  async createEvent(eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      const eventId = uuidv4();
      const eventRef = doc(db, 'events', eventId);

      console.log('🔴 DATABASE SERVICE - CREATING EVENT WITH DATES:');
      console.log('Raw start_datetime:', eventData.start_datetime);
      console.log('Raw end_datetime:', eventData.end_datetime);
      console.log('Type of start_datetime:', typeof eventData.start_datetime);
      console.log('Type of end_datetime:', typeof eventData.end_datetime);

      // FIXED: Use the dates as they come from the components - NO CONVERSION
      const event: Event = {
        id: eventId,
        name: eventData.name || '',
        subtitle: eventData.subtitle || undefined,
        description: eventData.description || '',
        location: eventData.location || '',
        lat: eventData.lat || 0,
        lng: eventData.lng || 0,
        // FIXED: Use dates directly without conversion
        start_datetime: eventData.start_datetime,
        end_datetime: eventData.end_datetime,
        capacity: eventData.capacity === undefined || eventData.capacity === null 
          ? undefined 
          : Number(eventData.capacity),
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

      console.log('🔴 FINAL EVENT DATES BEING SAVED:');
      console.log('start_datetime:', event.start_datetime);
      console.log('end_datetime:', event.end_datetime);

      const preparedEvent = this.prepareDataForFirestore(event);
      await setDoc(eventRef, preparedEvent);
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
        const convertedData = this.convertFromFirestore(data);
        
        console.log('🔴 DATABASE SERVICE - GETTING EVENT DATES:');
        console.log('Raw start_datetime from Firestore:', convertedData.start_datetime);
        console.log('Raw end_datetime from Firestore:', convertedData.end_datetime);
        console.log('Type of start_datetime:', typeof convertedData.start_datetime);
        console.log('Type of end_datetime:', typeof convertedData.end_datetime);

        const event = {
          ...convertedData,
          // FIXED: Use safe conversion but log what's happening
          start_datetime: this.safeDateConvert(convertedData.start_datetime),
          end_datetime: this.safeDateConvert(convertedData.end_datetime),
          createdAt: this.safeDateConvert(convertedData.createdAt),
          updatedAt: this.safeDateConvert(convertedData.updatedAt)
        } as Event;

        console.log('🔴 AFTER CONVERSION:');
        console.log('start_datetime:', event.start_datetime);
        console.log('end_datetime:', event.end_datetime);

        return event;
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
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          id: doc.id,
          start_datetime: this.safeDateConvert(convertedData.start_datetime),
          end_datetime: this.safeDateConvert(convertedData.end_datetime),
          createdAt: this.safeDateConvert(convertedData.createdAt),
          updatedAt: this.safeDateConvert(convertedData.updatedAt)
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
    
    console.log('🔴 DATABASE SERVICE - UPDATING EVENT DATES:');
    console.log('Updates start_datetime:', updates.start_datetime);
    console.log('Updates end_datetime:', updates.end_datetime);
    
    // Handle capacity conversion if it's being updated
    const processedUpdates = { ...updates };
    if ('capacity' in processedUpdates) {
      processedUpdates.capacity = processedUpdates.capacity === undefined || processedUpdates.capacity === null 
        ? undefined 
        : Number(processedUpdates.capacity);
    }
    
    // Handle subtitle conversion if it's being updated
    if ('subtitle' in processedUpdates) {
      processedUpdates.subtitle = processedUpdates.subtitle || undefined;
    }
    
    const preparedUpdates = this.prepareDataForFirestore({
      ...processedUpdates,
      updatedAt: new Date()
    });
    
    await updateDoc(eventRef, preparedUpdates);
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
        eventName: event.name,
        status,
        registeredAt: new Date()
      };
      
      const preparedRegistration = this.prepareDataForFirestore(registration);
      await setDoc(registrationRef, preparedRegistration);
      
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
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          registeredAt: this.safeDateConvert(convertedData.registeredAt)
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
      const convertedData = this.convertFromFirestore(data);
      return {
        ...convertedData,
        registeredAt: this.safeDateConvert(convertedData.registeredAt)
      } as EventRegistration;
    } catch (error) {
      console.error('Error getting user registration:', error);
      return null;
    }
  }

  // FIXED: Chat message methods with proper image handling
  async sendChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> {
    const messageId = uuidv4();
    const messageRef = doc(db, 'chatMessages', messageId);
    
    const chatMessage: ChatMessage = {
      ...message,
      id: messageId,
      timestamp: new Date(),
      edited: false
    };
    
    console.log('🔴 SENDING CHAT MESSAGE:', {
      id: chatMessage.id,
      senderUid: chatMessage.senderUid,
      content: chatMessage.content,
      hasImage: !!chatMessage.image,
      eventId: chatMessage.eventId,
      timestamp: chatMessage.timestamp
    });
    
    const preparedMessage = this.prepareDataForFirestore(chatMessage);
    
    try {
      await setDoc(messageRef, preparedMessage);
      console.log('✅ Chat message sent successfully');
      return chatMessage;
    } catch (error) {
      console.error('❌ Error sending chat message:', error);
      throw error;
    }
  }

  async updateChatMessage(messageId: string, updates: Partial<ChatMessage>): Promise<void> {
    const messageRef = doc(db, 'chatMessages', messageId);
    
    const updateData: any = {
      ...updates,
      edited: true,
      editedAt: new Date()
    };
    
    // Don't include image in updates if it's not being changed
    if (!updates.image) {
      delete updateData.image;
    }
    
    const preparedUpdates = this.prepareDataForFirestore(updateData);
    
    try {
      await updateDoc(messageRef, preparedUpdates);
      console.log('✅ Chat message updated successfully');
    } catch (error) {
      console.error('❌ Error updating chat message:', error);
      throw error;
    }
  }

  async deleteChatMessage(messageId: string): Promise<void> {
    try {
      const messageRef = doc(db, 'chatMessages', messageId);
      await deleteDoc(messageRef);
    } catch (error) {
      console.error('Error deleting chat message:', error);
      throw error;
    }
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
        const convertedData = this.convertFromFirestore(data);
        
        console.log('🔴 RECEIVED CHAT MESSAGE:', {
          id: doc.id,
          content: convertedData.content,
          hasImage: !!convertedData.image,
          timestamp: convertedData.timestamp
        });
        
        return {
          ...convertedData,
          id: doc.id,
          timestamp: this.safeDateConvert(convertedData.timestamp),
          editedAt: convertedData.editedAt ? this.safeDateConvert(convertedData.editedAt) : undefined
        } as ChatMessage;
      });
      
      console.log('🔴 TOTAL MESSAGES RECEIVED:', messages.length);
      callback(messages);
    }, (error) => {
      console.error('❌ Error in chat subscription:', error);
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
    
    const preparedNotification = this.prepareDataForFirestore(newNotification);
    await setDoc(notificationRef, preparedNotification);
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
        const convertedData = this.convertFromFirestore(data);
        return {
          ...convertedData,
          createdAt: this.safeDateConvert(convertedData.createdAt)
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

  async scheduleUserDeletion(userId: string, deletionDate: Date): Promise<void> {
    try {
      const scheduledDeletionRef = doc(db, 'scheduledDeletions', userId);
      
      const scheduledDeletion = {
        userId,
        deletionDate,
        scheduledAt: new Date(),
        status: 'scheduled'
      };
      
      const preparedDeletion = this.prepareDataForFirestore(scheduledDeletion);
      await setDoc(scheduledDeletionRef, preparedDeletion);
      
      console.log(`User ${userId} scheduled for deletion on ${deletionDate}`);
    } catch (error) {
      console.error('Error scheduling user deletion:', error);
      throw new Error('Failed to schedule user deletion');
    }
  }

  async cancelScheduledDeletion(userId: string): Promise<void> {
    try {
      const scheduledDeletionRef = doc(db, 'scheduledDeletions', userId);
      await deleteDoc(scheduledDeletionRef);
      
      console.log(`Cancelled scheduled deletion for user: ${userId}`);
    } catch (error) {
      console.error('Error cancelling scheduled deletion:', error);
      throw new Error('Failed to cancel scheduled deletion');
    }
  }

  async getScheduledDeletions(): Promise<Array<{userId: string, deletionDate: Date}>> {
    try {
      const now = new Date();
      const deletionsQuery = query(
        collection(db, 'scheduledDeletions'),
        where('deletionDate', '<=', now),
        where('status', '==', 'scheduled')
      );
      
      const deletionsSnap = await getDocs(deletionsQuery);
      return deletionsSnap.docs.map(doc => {
        const data = doc.data();
        const convertedData = this.convertFromFirestore(data);
        return {
          userId: convertedData.userId,
          deletionDate: this.safeDateConvert(convertedData.deletionDate)
        };
      });
    } catch (error) {
      console.error('Error getting scheduled deletions:', error);
      return [];
    }
  }

  async markDeletionAsProcessed(userId: string): Promise<void> {
    try {
      const scheduledDeletionRef = doc(db, 'scheduledDeletions', userId);
      await updateDoc(scheduledDeletionRef, {
        status: 'processed',
        processedAt: new Date()
      });
    } catch (error) {
      console.error('Error marking deletion as processed:', error);
      throw error;
    }
  }

  // Enhanced deleteUserData method to handle soft delete cleanup
  async deleteUserData(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      
      // First, get user data to check if it's a soft delete scenario
      const userDoc = await getDoc(userRef);
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      // Delete user document
      await deleteDoc(userRef);
      
      // Delete user's event registrations
      const registrationsQuery = query(
        collection(db, 'eventRegistrations'),
        where('userUid', '==', userId)
      );
      const registrationsSnap = await getDocs(registrationsQuery);
      const deleteRegistrations = registrationsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteRegistrations);
      
      // Delete user's affiliation requests
      const affiliationQuery = query(
        collection(db, 'affiliationRequests'),
        where('userUid', '==', userId)
      );
      const affiliationSnap = await getDocs(affiliationQuery);
      const deleteAffiliations = affiliationSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteAffiliations);
      
      // Delete user's notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
      );
      const notificationsSnap = await getDocs(notificationsQuery);
      const deleteNotifications = notificationsSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteNotifications);
      
      // Delete user's chat messages
      const chatMessagesQuery = query(
        collection(db, 'chatMessages'),
        where('userId', '==', userId)
      );
      const chatMessagesSnap = await getDocs(chatMessagesQuery);
      const deleteChatMessages = chatMessagesSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deleteChatMessages);
      
      // Remove user from event registeredUsers arrays
      const eventsQuery = query(
        collection(db, 'events'),
        where('registeredUsers', 'array-contains', userId)
      );
      const eventsSnap = await getDocs(eventsQuery);
      
      const updateEvents = eventsSnap.docs.map(async (doc) => {
        const event = doc.data() as Event;
        const updatedRegisteredUsers = event.registeredUsers?.filter(uid => uid !== userId) || [];
        await updateDoc(doc.ref, { registeredUsers: updatedRegisteredUsers });
      });
      
      await Promise.all(updateEvents);
      
      // Remove user from organization admin users
      const orgsQuery = query(
        collection(db, 'organizations'),
        where('adminUsers', 'array-contains', userId)
      );
      const orgsSnap = await getDocs(orgsQuery);
      
      const updateOrgs = orgsSnap.docs.map(async (doc) => {
        const org = doc.data() as Organization;
        const updatedAdminUsers = org.adminUsers?.filter(uid => uid !== userId) || [];
        await updateDoc(doc.ref, { adminUsers: updatedAdminUsers });
      });
      
      await Promise.all(updateOrgs);
      
      // Remove user from organization affiliated students
      const orgsWithStudentsQuery = query(
        collection(db, 'organizations'),
        where('affiliatedStudents', 'array-contains', userId)
      );
      const orgsWithStudentsSnap = await getDocs(orgsWithStudentsQuery);
      
      const updateOrgsStudents = orgsWithStudentsSnap.docs.map(async (doc) => {
        const org = doc.data() as Organization;
        const updatedAffiliatedStudents = org.affiliatedStudents?.filter(uid => uid !== userId) || [];
        await updateDoc(doc.ref, { affiliatedStudents: updatedAffiliatedStudents });
      });
      
      await Promise.all(updateOrgsStudents);
      
      // Delete any scheduled deletion record
      await this.cancelScheduledDeletion(userId);
      
      console.log(`Successfully cleaned up data for user: ${userId}`);
      
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw new Error('Failed to delete user data');
    }
  }

  // Add this method to process scheduled deletions (to be called by a scheduled function/cloud function)
  async processScheduledDeletions(): Promise<void> {
    try {
      const deletionsToProcess = await this.getScheduledDeletions();
      
      for (const deletion of deletionsToProcess) {
        try {
          console.log(`Processing deletion for user: ${deletion.userId}`);
          
          // Delete user data from Firestore
          await this.deleteUserData(deletion.userId);
          
          // Mark deletion as processed
          await this.markDeletionAsProcessed(deletion.userId);
          
          console.log(`Successfully processed deletion for user: ${deletion.userId}`);
        } catch (error) {
          console.error(`Error processing deletion for user ${deletion.userId}:`, error);
          // Continue with other deletions even if one fails
        }
      }
    } catch (error) {
      console.error('Error processing scheduled deletions:', error);
      throw error;
    }
  }
}

export const databaseService = new DatabaseService();