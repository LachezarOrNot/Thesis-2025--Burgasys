import { describe, expect, it } from 'vitest';
import {
  convertFromFirestore,
  prepareDataForFirestore,
  safeDateConvert,
} from './firestoreHelpers';

describe('safeDateConvert', () => {
  it('returns a Date for null/undefined', () => {
    expect(safeDateConvert(null)).toBeInstanceOf(Date);
    expect(safeDateConvert(undefined)).toBeInstanceOf(Date);
  });

  it('returns valid Date instances unchanged', () => {
    const date = new Date('2026-05-21T18:30:00Z');
    expect(safeDateConvert(date)).toBe(date);
  });

  it('replaces invalid Date with a new Date', () => {
    const invalid = new Date('not-a-date');
    const result = safeDateConvert(invalid);
    expect(result).toBeInstanceOf(Date);
    expect(result).not.toBe(invalid);
  });

  it('converts Firestore timestamp objects with toDate()', () => {
    const firestoreDate = new Date('2026-01-15T10:00:00Z');
    const timestamp = { toDate: () => firestoreDate };
    expect(safeDateConvert(timestamp)).toEqual(firestoreDate);
  });

  it('converts serialized timestamps with seconds', () => {
    const result = safeDateConvert({ seconds: 1_700_000_000 });
    expect(result.getTime()).toBe(1_700_000_000_000);
  });

  it('parses ISO date strings', () => {
    const result = safeDateConvert('2026-05-21T18:30:00Z');
    expect(result.toISOString()).toBe('2026-05-21T18:30:00.000Z');
  });
});

describe('prepareDataForFirestore', () => {
  it('converts undefined to null', () => {
    expect(prepareDataForFirestore(undefined)).toBeNull();
  });

  it('strips undefined from nested objects', () => {
    expect(
      prepareDataForFirestore({
        name: 'Test',
        optional: undefined,
        nested: { keep: 1, drop: undefined },
      }),
    ).toEqual({
      name: 'Test',
      optional: null,
      nested: { keep: 1, drop: null },
    });
  });

  it('preserves Date values', () => {
    const date = new Date('2026-05-21');
    expect(prepareDataForFirestore(date)).toBe(date);
  });
});

describe('convertFromFirestore', () => {
  it('restores nested nulls to undefined', () => {
    expect(
      convertFromFirestore({
        name: 'Test',
        optional: null,
      }),
    ).toEqual({
      name: 'Test',
      optional: undefined,
    });
  });
});
