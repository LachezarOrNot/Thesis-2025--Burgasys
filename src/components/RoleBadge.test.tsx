import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoleBadge from './RoleBadge';

describe('RoleBadge', () => {
  it('renders admin label', () => {
    render(<RoleBadge role="admin" />);
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('renders student label', () => {
    render(<RoleBadge role="student" />);
    expect(screen.getByText('Student')).toBeInTheDocument();
  });

  it('applies size classes', () => {
    const { container } = render(<RoleBadge role="firm" size="lg" />);
    const badge = container.querySelector('span');
    expect(badge?.className).toContain('text-base');
    expect(screen.getByText('Firm')).toBeInTheDocument();
  });
});
