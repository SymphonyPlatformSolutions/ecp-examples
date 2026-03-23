import { fireEvent, render, screen } from '@testing-library/react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

describe('Avatar', () => {
  test('hides fallback content once the image has loaded', () => {
    render(
      <Avatar>
        <AvatarImage src="/profiles/hans.png" alt="Hans Gruber" />
        <AvatarFallback>HG</AvatarFallback>
      </Avatar>,
    );

    const image = screen.getByRole('img', { name: 'Hans Gruber' });
    expect(screen.getByText('HG')).toBeInTheDocument();

    fireEvent.load(image);

    expect(screen.queryByText('HG')).not.toBeInTheDocument();
  });

  test('keeps fallback content visible when the image fails', () => {
    render(
      <Avatar>
        <AvatarImage src="/profiles/hans.png" alt="Hans Gruber" />
        <AvatarFallback>HG</AvatarFallback>
      </Avatar>,
    );

    fireEvent.error(screen.getByRole('img', { name: 'Hans Gruber' }));

    expect(screen.getByText('HG')).toBeInTheDocument();
  });
});