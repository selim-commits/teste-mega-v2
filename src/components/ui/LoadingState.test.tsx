import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingState } from './LoadingState';

describe('LoadingState', () => {
  it('renders default message', () => {
    render(<LoadingState />);
    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingState message="Patientez..." />);
    expect(screen.getByText('Patientez...')).toBeInTheDocument();
  });

  it('renders spinner', () => {
    const { container } = render(<LoadingState />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });
});
