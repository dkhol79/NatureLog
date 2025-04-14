import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';
import SideNav from './SideNav';
import '@fortawesome/fontawesome-free/css/all.min.css';

const CommunityPage = ({ token }) => {
  const [community, setCommunity] = useState(null);
  const [entries, setEntries] = useState([]);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const { id } = useParams();
  const history = useHistory();

  useEffect(() => {
    if (!token) {
      history.push('/login');
      return;
    }

    const fetchCommunity = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/communities/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCommunity(res.data);
      } catch (err) {
        console.error('Error fetching community:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          handleLogout();
        } else if (err.response?.status === 403) {
          alert('You do not have access to this community.');
          history.push('/my-communities');
        } else {
          alert('Community not found.');
          history.push('/my-communities');
        }
      }
    };

    const fetchEntries = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal/community/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching community entries:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          handleLogout();
        } else if (err.response?.status === 403) {
          alert('Access to community entries denied.');
          history.push('/my-communities');
        } else {
          setEntries([]);
          setLoading(false);
        }
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
        if (err.response?.status === 401) {
          handleLogout();
        }
      }
    };

    fetchCommunity();
    fetchEntries();
    fetchSidebarEntries();
  }, [id, token, history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const handleViewDetails = () => {
    history.push(`/community/${id}`);
  };

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry) =>
      entry.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  if (loading) {
    return (
      <div className="loading">
        <span>Loading...</span>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="app-container">
        <SideNav
          token={token}
          entries={sidebarEntries}
          handleLogout={handleLogout}
          handleCardClick={handleCardClick}
        />
        <main className="main-content">
          <div className="community-feed-container">
            <p>Community not found.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <SideNav
        token={token}
        entries={sidebarEntries}
        handleLogout={handleLogout}
        handleCardClick={handleCardClick}
      />
      <main className="main-content">
        <div className="community-feed-container">
          <h2>{community.name}</h2>
          <div className="search-and-add">
            <input
              type="text"
              value={search}
              onChange={handleSearch}
              placeholder="Search entries by title..."
              className="search-bar"
            />
            <button
              onClick={handleSort}
              className="sort-btn"
              title={`Sort by date (${sortOrder === 'desc' ? 'newest first' : 'oldest first'})`}
            >
              <i className="fas fa-sort"></i>
            </button>
            <button
              onClick={handleViewDetails}
              className="add-entry-btn"
            >
              View Community Details
            </button>
          </div>
          <div className="entries-grid">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <div
                  key={entry._id}
                  className="entry-card"
                  onClick={() => handleCardClick(entry._id)}
                >
                  {entry.photos?.length > 0 && (
                    <img
                      src={`${process.env.REACT_APP_API_URL}/${entry.photos[0]}`}
                      alt={entry.title}
                      className="entry-image"
                    />
                  )}
                  <h3>{entry.title}</h3>
                  <p><strong>Date:</strong> {entry.date}</p>
                  <p><strong>Category:</strong> {entry.category}</p>
                  <p><strong>Location:</strong> {entry.location}</p>
                  <p><strong>Posted by:</strong> {entry.username}</p>
                </div>
              ))
            ) : (
              <p>No entries found for this community.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityPage;