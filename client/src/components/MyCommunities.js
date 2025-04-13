import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import SideNav from './SideNav';
import '@fortawesome/fontawesome-free/css/all.min.css';

const MyCommunities = ({ token }) => {
  const [communities, setCommunities] = useState([]);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc');
  const history = useHistory();

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/communities`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sortedCommunities = res.data.sort((a, b) =>
          sortOrder === 'desc'
            ? new Date(b.createdAt) - new Date(a.createdAt)
            : new Date(a.createdAt) - new Date(b.createdAt)
        );
        setCommunities(sortedCommunities);
      } catch (err) {
        console.error('Error fetching communities:', err.response?.data || err.message);
      }
    };

    const fetchSidebarEntries = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSidebarEntries(res.data);
      } catch (err) {
        console.error('Error fetching sidebar entries:', err.response?.data || err.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchCommunities(), fetchSidebarEntries()]);
      setLoading(false);
    };

    fetchData();
  }, [token, sortOrder]);

  const handleCommunityClick = (id) => {
    history.push(`/community/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleSidebarCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  const handleSortToggle = () => {
    setSortOrder((prevOrder) => (prevOrder === 'desc' ? 'asc' : 'desc'));
  };

  const filteredCommunities = communities.filter((community) => {
    const lowerSearch = search.toLowerCase();
    return (
      community.name.toLowerCase().includes(lowerSearch) ||
      community.description.toLowerCase().includes(lowerSearch) ||
      community.adminUsername.toLowerCase().includes(lowerSearch)
    );
  });

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="app-container">
      <SideNav
        token={token}
        entries={sidebarEntries}
        handleLogout={handleLogout}
        handleCardClick={handleSidebarCardClick}
      />
      <main className="main-content">
        <div className="community-feed-container">
          <h2>My Communities</h2>
          <div className="search-and-add">
            <input
              type="text"
              placeholder="Search by name, description, admin..."
              className="search-bar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              onClick={handleSortToggle}
              className="sort-btn"
              title={`Sort by date (${sortOrder === 'desc' ? 'newest first' : 'oldest first'})`}
            >
              <i className="fas fa-sort"></i>
            </button>
            <button
              onClick={() => history.push('/community-create')}
              className="add-entry-btn"
            >
              Create New Community
            </button>
          </div>
          <div className="entries-grid">
            {filteredCommunities.length === 0 ? (
              <p>No communities found. Create one to get started!</p>
            ) : (
              filteredCommunities.map((community) => (
                <div
                  key={community._id}
                  className="entry-card community-card"
                  onClick={() => handleCommunityClick(community._id)}
                >
                  <div className="entry-header">
                    <h3>{community.name}</h3>
                    <p className="community-meta">
                      Members: {community.members.length} | Admin: {community.adminUsername}
                    </p>
                    <p className="entry-date-time">
                      Created: {new Date(community.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="entry-preview">{community.description}</p>
                  <p>
                    <strong>Categories:</strong>{' '}
                    {Object.keys(community.categories)
                      .filter((cat) => community.categories[cat])
                      .join(', ') || 'None'}
                  </p>
                  <p>
                    <strong>Type:</strong>{' '}
                    {community.communityType.charAt(0).toUpperCase() +
                      community.communityType.slice(1)}
                  </p>
                  {community.isMature && (
                    <p>
                      <strong>Mature:</strong> 18+
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyCommunities;