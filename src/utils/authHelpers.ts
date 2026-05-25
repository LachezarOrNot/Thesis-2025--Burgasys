import type { UserRole } from '../types';

const ROLES_REQUIRING_APPROVAL: UserRole[] = ['school', 'university', 'firm'];

export function roleRequiresApproval(role: UserRole): boolean {
  return ROLES_REQUIRING_APPROVAL.includes(role);
}
