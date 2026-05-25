import { describe, expect, it } from 'vitest';
import { roleRequiresApproval } from './authHelpers';
import type { UserRole } from '../types';

describe('roleRequiresApproval', () => {
  it.each(['school', 'university', 'firm'] as UserRole[])(
    'returns true for organization role %s',
    (role) => {
      expect(roleRequiresApproval(role)).toBe(true);
    },
  );

  it.each(['admin', 'user', 'student'] as UserRole[])(
    'returns false for role %s',
    (role) => {
      expect(roleRequiresApproval(role)).toBe(false);
    },
  );
});
