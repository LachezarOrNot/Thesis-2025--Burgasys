export type RegistrationStatus = 'registered' | 'waitlisted';

export function resolveRegistrationStatus(
  capacity: number | undefined,
  registeredCount: number,
): RegistrationStatus {
  if (capacity != null && capacity > 0 && registeredCount >= capacity) {
    return 'waitlisted';
  }
  return 'registered';
}
