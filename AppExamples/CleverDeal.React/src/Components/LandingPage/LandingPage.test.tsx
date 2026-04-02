import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LandingPage } from './LandingPage';

test('navigates to the Wealth Management route when the tile is clicked', async () => {
  render(
    <MemoryRouter
      initialEntries={['/']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/wealth-management" element={<div>Wealth Management Route</div>} />
      </Routes>
    </MemoryRouter>,
  );

  await userEvent.click(screen.getByRole('heading', { name: 'Wealth Management' }));

  expect(screen.getByText('Wealth Management Route')).toBeInTheDocument();
});
