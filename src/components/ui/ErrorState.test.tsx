import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('renders default title', () => {
    render(<ErrorState />);
    expect(screen.getByText('Une erreur est survenue')).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<ErrorState message="Erreur reseau" />);
    expect(screen.getByText('Erreur reseau')).toBeInTheDocument();
  });

  it('calls onRetry when button clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    fireEvent.click(screen.getByText('Reessayer'));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
