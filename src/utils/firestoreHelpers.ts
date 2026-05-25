import type { DocumentData } from 'firebase/firestore';

/** Converts Firestore / serialized timestamps and strings into JavaScript Date. */
export function safeDateConvert(date: unknown): Date {
  if (date == null) return new Date();

  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  if (
    typeof date === 'object' &&
    date !== null &&
    'toDate' in date &&
    typeof (date as { toDate: () => Date }).toDate === 'function'
  ) {
    return (date as { toDate: () => Date }).toDate();
  }

  if (
    typeof date === 'object' &&
    date !== null &&
    'seconds' in date &&
    typeof (date as { seconds: number }).seconds === 'number'
  ) {
    return new Date((date as { seconds: number }).seconds * 1000);
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  return new Date();
}

/** Replaces undefined with null so Firestore accepts nested objects. */
export function prepareDataForFirestore(data: unknown): DocumentData {
  if (data === undefined) return null as unknown as DocumentData;
  if (data === null) return null as unknown as DocumentData;

  if (Array.isArray(data)) {
    return data.map((item) => prepareDataForFirestore(item));
  }

  if (data && typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    Object.keys(data).forEach((key) => {
      cleaned[key] = prepareDataForFirestore((data as Record<string, unknown>)[key]);
    });
    return cleaned;
  }

  return data as DocumentData;
}

/** Converts Firestore null values back to undefined for app types. */
function convertFromFirestoreValue(data: unknown): unknown {
  if (data === null) return undefined;

  if (Array.isArray(data)) {
    return data.map((item) => convertFromFirestoreValue(item));
  }

  if (data && typeof data === 'object' && !(data instanceof Date)) {
    const converted: Record<string, unknown> = {};
    Object.keys(data).forEach((key) => {
      converted[key] = convertFromFirestoreValue((data as Record<string, unknown>)[key]);
    });
    return converted;
  }

  return data;
}

/** Converts a Firestore document snapshot to a plain object for app models. */
export function convertFromFirestore(data: DocumentData): Record<string, unknown> {
  return convertFromFirestoreValue(data) as Record<string, unknown>;
}
