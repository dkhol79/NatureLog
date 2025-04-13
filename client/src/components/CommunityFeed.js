import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import SideNav from './SideNav';
import '@fortawesome/fontawesome-free/css/all.min.css';

const CommunityFeed = ({ token }) => {
  const [entries, setEntries] = useState([]);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' for newest first, 'asc' for oldest first
  const history = useHistory();

  useEffect(() => {
    const fetchCommunityEntries = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal/community`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const sortedEntries = res.data.sort((a, b) =>
          sortOrder === 'desc'
            ? new Date(b.timestamp) - new Date(a.timestamp)
            : new Date(a.timestamp) - new Date(b.timestamp)
        );
        setEntries(sortedEntries);
      } catch (err) {
        console.error('Error fetching community feed:', err.response?.data || err.message);
      }
    };

    const fetchSidebarEntries = async () => {
      if (!token) return;
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
      await Promise.all([fetchCommunityEntries(), fetchSidebarEntries()]);
      setLoading(false);
    };

    fetchData();
  }, [token, sortOrder]);

  const handleCardClick = (id) => {
    history.push(`/entry/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleSidebarCardClick = (entryId) => {
    if (token) {
      history.push(`/entry/${entryId}`);
    }
  };

  const handleAddNewEntry = () => {
    history.push('/journal');
  };

  const handleSortToggle = () => {
    setSortOrder(prevOrder => (prevOrder === 'desc' ? 'asc' : 'desc'));
  };

  const getContentPreview = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const textContent = doc.body.textContent || '';
    const sentences = textContent.split('.').filter(s => s.trim().length > 0);
    const previewSentences = sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '...' : '.');
    return previewSentences;
  };

  const filteredEntries = entries.filter(entry => {
    const lowerSearch = search.toLowerCase();
    return (
      entry.title.toLowerCase().includes(lowerSearch) ||
      entry.category?.toLowerCase().includes(lowerSearch) ||
      entry.username?.toLowerCase().includes(lowerSearch)
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
          <h2>Community Feed</h2>
          <div className="search-and-add">
            <input
              type="text"
              placeholder="Search by title, category, username..."
              className="search-bar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={handleSortToggle} className="sort-btn" title={`Sort by date (${sortOrder === 'desc' ? 'newest first' : 'oldest first'})`}>
              <i className="fas fa-sort"></i>
            </button>
            {token && (
              <button onClick={handleAddNewEntry} className="add-entry-btn">
                Add New Entry
              </button>
            )}
          </div>
          <div className="entries-grid">
            {filteredEntries.length === 0 ? (
              <p>No public entries found.</p>
            ) : (
              filteredEntries.map(entry => (
                <div
                  key={entry._id}
                  className="entry-card"
                  onClick={() => handleCardClick(entry._id)}
                >
                  <div className="entry-header">
                    <h3>{entry.title}</h3>
                    <p className="entry-date-time">
                      {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {entry.photos?.length > 0 && (
                    <img
                      src={`${process.env.REACT_APP_API_URL}/${entry.photos[0]}`}
                      alt={entry.title}
                      className="entry-preview-image"
                    />
                  )}
                  <p className="entry-preview">
                    {getContentPreview(entry.content)}
                  </p>
                  <p><strong>Category:</strong> <span>{entry.category}</span></p>
                  <p><strong>Weather:</strong> <span>
                    {entry.weather?.main?.temp
                      ? `${((entry.weather.main.temp - 273.15) * 9/5 + 32).toFixed(1)}°F`
                      : 'N/A'}
                  </span></p>
                  <p><strong>By:</strong> <span>{entry.username}</span></p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityFeed;