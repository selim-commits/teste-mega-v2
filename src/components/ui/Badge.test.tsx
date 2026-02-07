import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children', () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('applies variant class', () => {
    const { container } = render(<Badge variant="success">OK</Badge>);
    expect(container.firstChild).toHaveClass('success');
  });

  it('applies size class', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    expect(container.firstChild).toHaveClass('sm');
  });

  it('shows dot when dot prop is true', () => {
    const { container } = render(<Badge dot>Dotted</Badge>);
    expect(container.querySelector('.dot')).toBeInTheDocument();
  });
});
