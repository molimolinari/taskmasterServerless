import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('should render the app title', () => {
    render(<App />);
    expect(screen.getByText(/Resumen de pedidos/i)).toBeInTheDocument();
  });

  it('should render the task form', () => {
    render(<App />);
    expect(screen.getByLabelText(/Descripción de la tarea/i)).toBeInTheDocument();
  });

  it('should have a submit button', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /Agregar Tarea/i })).toBeInTheDocument();
  });
});
