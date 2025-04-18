import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Route } from 'react-router-dom';
import CommunityManage from '../components/CommunityManage';

jest.mock('axios');

describe('CommunityManage Component', () => {
  const mockToken = 'mock-token';
  const mockCommunity = {
    _id: '123',
    name: 'Test Community',
    description: 'A test community',
    categories: { Plants: true, Wildlife: false },
    rules: 'No spam',
    communityType: 'public',
    isMature: false,
    membersDetails: [
      { _id: 'user1', username: 'user1', email: 'user1@example.com', isAdmin: false },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockImplementation((url) => {
      if (url.includes('/api/communities/123')) {
        return Promise.resolve({ data: mockCommunity });
      }
      if (url.includes('/api/journal')) {
        return Promise.resolve({ data: [] });
      }
      if (url.includes('/api/users/search')) {
        return Promise.resolve({
          data: [{ _id: 'user2', username: 'user2', email: 'user2@example.com' }],
        });
      }
      return Promise.reject(new Error('Not found'));
    });
    axios.post.mockImplementation(() => Promise.resolve({ data: {} }));
    axios.put.mockImplementation(() => Promise.resolve({ data: {} }));
  });

  test('renders community management form', async () => {
    render(
      <MemoryRouter initialEntries={['/community-manage/123']}>
        <Route path="/community-manage/:id">
          <CommunityManage token={mockToken} />
        </Route>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Community: Test Community')).toBeInTheDocument();
      expect(screen.getByLabelText('Community Name:')).toHaveValue('Test Community');
      expect(screen.getByLabelText('Description:')).toHaveValue('A test community');
      expect(screen.getByLabelText('Rules:')).toHaveValue('No spam');
    });
  });

  test('updates community details successfully', async () => {
    render(
      <MemoryRouter initialEntries={['/community-manage/123']}>
        <Route path="/community-manage/:id">
          <CommunityManage token={mockToken} />
        </Route>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Community: Test Community')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Community Name:'), { target: { value: 'Updated Community' } });
    fireEvent.click(screen.getByText('Update Community'));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/communities/123`,
        expect.objectContaining({ name: 'Updated Community' }),
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
    });
  });

  test('searches and adds a new member', async () => {
    axios.get.mockImplementationOnce((url) => {
      if (url.includes('/api/communities/123')) {
        return Promise.resolve({
          data: {
            ...mockCommunity,
            membersDetails: [
              ...mockCommunity.membersDetails,
              { _id: 'user2', username: 'user2', email: 'user2@example.com', isAdmin: false },
            ],
          },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <MemoryRouter initialEntries={['/community-manage/123']}>
        <Route path="/community-manage/:id">
          <CommunityManage token={mockToken} />
        </Route>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Community: Test Community')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Search for users to add...'), { target: { value: 'user2' } });
    fireEvent.click(screen.getByText('Search'));

    await waitFor(() => {
      expect(screen.getByText('user2 (user2@example.com)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/communities/123/members`,
        { userId: 'user2' },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
    });
  });

  test('toggles admin status for a member', async () => {
    axios.get.mockImplementationOnce((url) => {
      if (url.includes('/api/communities/123')) {
        return Promise.resolve({
          data: {
            ...mockCommunity,
            membersDetails: [
              { _id: 'user1', username: 'user1', email: 'user1@example.com', isAdmin: true },
            ],
          },
        });
      }
      return Promise.reject(new Error('Not found'));
    });

    render(
      <MemoryRouter initialEntries={['/community-manage/123']}>
        <Route path="/community-manage/:id">
          <CommunityManage token={mockToken} />
        </Route>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Manage Community: Test Community')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Make Admin'));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        `${process.env.REACT_APP_API_URL}/api/communities/123/admin`,
        { userId: 'user1', isAdmin: true },
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
    });
  });
});