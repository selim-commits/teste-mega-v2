import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders title', () => {
    render(<EmptyState title="Aucun resultat" />);
    expect(screen.getByText('Aucun resultat')).toBeInTheDocument();
  });

  it('renders description', () => {
    render(<EmptyState title="Vide" description="Essayez autre chose" />);
    expect(screen.getByText('Essayez autre chose')).toBeInTheDocument();
  });

  it('renders action button', () => {
    render(<EmptyState title="Vide" action={<button>Ajouter</button>} />);
    expect(screen.getByText('Ajouter')).toBeInTheDocument();
  });
});
