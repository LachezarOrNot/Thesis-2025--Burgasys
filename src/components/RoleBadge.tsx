import React from 'react';
import { UserRole } from '../types';

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    school: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    firm: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    student: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    university: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
  };

  const roleLabels = {
    admin: 'Admin',
    school: 'School',
    firm: 'Firm',
    user: 'User',
    student: 'Student',
    university: 'University'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]} ${roleColors[role]}`}>
      {roleLabels[role]}
    </span>
  );
};

export default RoleBadge;