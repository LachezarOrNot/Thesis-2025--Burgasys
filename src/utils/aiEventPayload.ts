export const EVENT_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export interface AssistantCreateEventPayload {
  action: 'create_event';
  name: string;
  description?: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  capacity?: number;
  tags?: string[];
  allow_registration?: boolean;
}

export type EventDateValidationError =
  | 'invalid_format'
  | 'invalid_date'
  | 'end_before_start'
  | 'start_in_past';

export function parseAssistantCreateEventPayload(
  rawReply: string,
  isAdmin: boolean,
): AssistantCreateEventPayload | null {
  if (!isAdmin) return null;

  const trimmed = rawReply.trim();
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonSlice = trimmed.slice(firstBrace, lastBrace + 1);

  try {
    const payload = JSON.parse(jsonSlice) as AssistantCreateEventPayload;
    if (payload.action !== 'create_event') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function validateEventDateTimes(
  startDatetime: string,
  endDatetime: string,
  now: Date = new Date(),
): EventDateValidationError | null {
  if (
    !EVENT_DATETIME_PATTERN.test(startDatetime) ||
    !EVENT_DATETIME_PATTERN.test(endDatetime)
  ) {
    return 'invalid_format';
  }

  const startDate = new Date(startDatetime);
  const endDate = new Date(endDatetime);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'invalid_date';
  }

  if (startDate >= endDate) {
    return 'end_before_start';
  }

  if (startDate.getTime() < now.getTime() - 5 * 60 * 1000) {
    return 'start_in_past';
  }

  return null;
}

export function getMissingEventFields(payload: AssistantCreateEventPayload): string[] {
  const missing: string[] = [];
  if (!payload.name) missing.push('name');
  if (!payload.location) missing.push('location');
  if (!payload.start_datetime) missing.push('start_datetime');
  if (!payload.end_datetime) missing.push('end_datetime');
  return missing;
}
