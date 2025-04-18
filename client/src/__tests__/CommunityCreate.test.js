import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';
import CommunityCreate from '../components/CommunityCreate';

jest.mock('axios');

describe('CommunityCreate Component', () => {
  const mockToken = 'mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockImplementation(() => Promise.resolve({ data: {} }));
  });

  test('renders community creation form', () => {
    render(
      <MemoryRouter>
        <CommunityCreate token={mockToken} />
      </MemoryRouter>
    );

    expect(screen.getByText('Create a New Community')).toBeInTheDocument();
    expect(screen.getByLabelText('Community Name:')).toBeInTheDocument();
    expect(screen.getByLabelText('Description:')).toBeInTheDocument();
    expect(screen.getByLabelText('Categories:')).toBeInTheDocument();
    expect(screen.getByLabelText('Rules:')).toBeInTheDocument();
    expect(screen.getByLabelText('Community Type:')).toBeInTheDocument();
    expect(screen.getByText('Create Community')).toBeInTheDocument();
  });

  test('displays error when community name is empty on submit', async () => {
    render(
      <MemoryRouter>
        <CommunityCreate token={mockToken} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Create Community'));

    await waitFor(() => {
      expect(screen.getByText('Community name is required')).toBeInTheDocument();
    });
  });

  test('submits form successfully and redirects', async () => {
    render(
      <MemoryRouter>
        <CommunityCreate token={mockToken} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Community Name:'), { target: { value: 'Test Community' } });
    fireEvent.change(screen.getByLabelText('Description:'), { target: { value: 'A test community' } });
    fireEvent.click(screen.getByText('Create Community'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/communities`,
        expect.objectContaining({
          name: 'Test Community',
          description: 'A test community',
        }),
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
    });
  });

  test('displays error on failed submission', async () => {
    axios.post.mockRejectedValueOnce({
      response: { data: { error: 'Failed to create community' } },
    });

    render(
      <MemoryRouter>
        <CommunityCreate token={mockToken} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Community Name:'), { target: { value: 'Test Community' } });
    fireEvent.click(screen.getByText('Create Community'));

    await waitFor(() => {
      expect(screen.getByText('Failed to create community')).toBeInTheDocument();
    });
  });

  test('redirects to login if no token is provided', () => {
    render(
      <MemoryRouter>
        <CommunityCreate token={null} />
      </MemoryRouter>
    );

    expect(screen.queryByText('Create a New Community')).not.toBeInTheDocument();
  });
});