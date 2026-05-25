import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);

const baseUser: User = {
  uid: 'user-1',
  email: 'user@test.com',
  displayName: 'Test User',
  role: 'user',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderProtectedRoute(requiredRole?: User['role']) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route
          path="/protected"
          element={
            <ProtectedRoute requiredRole={requiredRole}>
              <div>Secret content</div>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<div>Home page</div>} />
        <Route path="/events" element={<div>Events page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true,
    } as ReturnType<typeof useAuth>);

    const { container } = renderProtectedRoute();
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Secret content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated users to home', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute();
    expect(screen.getByText('Home page')).toBeInTheDocument();
  });

  it('renders children for authenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: baseUser,
      loading: false,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute();
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });

  it('redirects users without required role to events', () => {
    mockUseAuth.mockReturnValue({
      user: { ...baseUser, role: 'user' },
      loading: false,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute('admin');
    expect(screen.getByText('Events page')).toBeInTheDocument();
  });

  it('allows access when user has required role', () => {
    mockUseAuth.mockReturnValue({
      user: { ...baseUser, role: 'admin' },
      loading: false,
    } as ReturnType<typeof useAuth>);

    renderProtectedRoute('admin');
    expect(screen.getByText('Secret content')).toBeInTheDocument();
  });
});
