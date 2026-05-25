import { describe, expect, it } from 'vitest';
import {
  getMissingEventFields,
  parseAssistantCreateEventPayload,
  validateEventDateTimes,
} from './aiEventPayload';

const validPayload = {
  action: 'create_event' as const,
  name: 'Tech Meetup',
  location: 'Burgas Center',
  start_datetime: '2026-06-01T18:00',
  end_datetime: '2026-06-01T20:00',
};

describe('parseAssistantCreateEventPayload', () => {
  it('returns null for non-admin users', () => {
    const raw = JSON.stringify(validPayload);
    expect(parseAssistantCreateEventPayload(raw, false)).toBeNull();
  });

  it('parses JSON embedded in assistant text for admins', () => {
    const raw = `Here is your event: ${JSON.stringify(validPayload)} — done.`;
    expect(parseAssistantCreateEventPayload(raw, true)).toMatchObject(validPayload);
  });

  it('returns null when action is not create_event', () => {
    const raw = JSON.stringify({ action: 'delete_event', name: 'X' });
    expect(parseAssistantCreateEventPayload(raw, true)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseAssistantCreateEventPayload('{not json', true)).toBeNull();
  });
});

describe('getMissingEventFields', () => {
  it('lists all required missing fields', () => {
    expect(
      getMissingEventFields({
        ...validPayload,
        name: '',
        location: '',
        start_datetime: '',
        end_datetime: '',
      }),
    ).toEqual(['name', 'location', 'start_datetime', 'end_datetime']);
  });

  it('returns empty array when all required fields are present', () => {
    expect(getMissingEventFields(validPayload)).toEqual([]);
  });
});

describe('validateEventDateTimes', () => {
  const now = new Date('2026-05-25T12:00:00Z');

  it('accepts valid future range', () => {
    expect(
      validateEventDateTimes('2026-06-01T18:00', '2026-06-01T20:00', now),
    ).toBeNull();
  });

  it('rejects invalid format', () => {
    expect(
      validateEventDateTimes('01/06/2026 18:00', '2026-06-01T20:00', now),
    ).toBe('invalid_format');
  });

  it('rejects end before start', () => {
    expect(
      validateEventDateTimes('2026-06-01T20:00', '2026-06-01T18:00', now),
    ).toBe('end_before_start');
  });

  it('rejects start in the past', () => {
    expect(
      validateEventDateTimes('2026-05-20T10:00', '2026-05-20T12:00', now),
    ).toBe('start_in_past');
  });
});
