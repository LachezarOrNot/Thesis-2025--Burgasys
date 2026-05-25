import { describe, expect, it } from 'vitest';
import { resolveRegistrationStatus } from './eventRegistration';

describe('resolveRegistrationStatus', () => {
  it('registers when capacity is not set', () => {
    expect(resolveRegistrationStatus(undefined, 99)).toBe('registered');
  });

  it('registers when below capacity', () => {
    expect(resolveRegistrationStatus(10, 9)).toBe('registered');
  });

  it('waitlists when at capacity', () => {
    expect(resolveRegistrationStatus(10, 10)).toBe('waitlisted');
  });

  it('waitlists when over capacity', () => {
    expect(resolveRegistrationStatus(5, 8)).toBe('waitlisted');
  });
});
