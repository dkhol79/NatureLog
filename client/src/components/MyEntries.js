import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import SideNav from './SideNav';

const MyEntries = ({ token }) => {
  const [entries, setEntries] = useState([]);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const history = useHistory();

  useEffect(() => {
    if (!token) {
      history.push('/login');
      return;
    }

    const fetchUserEntries = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(res.data);
        setSidebarEntries(res.data);
      } catch (err) {
        console.error('Error fetching user entries:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          history.push('/login');
        }
      }
    };

    const fetchData = async () => {
      setLoading(true);
      await fetchUserEntries();
      setLoading(false);
    };

    fetchData();
  }, [token, history]);

  const handleCardClick = (id) => {
    history.push(`/entry/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleSidebarCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  const handleAddNewEntry = () => {
    history.push('/journal');
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
      entry.location?.toLowerCase().includes(lowerSearch)
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
        <div className="my-entries-container">
          <h2>My Entries</h2>
          <div className="search-and-add">
            <input
              type="text"
              placeholder="Search by title, category, location..."
              className="search-bar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button onClick={handleAddNewEntry} className="add-entry-btn">
              Add New Entry
            </button>
          </div>
          <div className="entries-grid">
            {filteredEntries.length === 0 ? (
              <p>No entries found.</p>
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
                  <p><strong>Location:</strong> <span>{entry.location || 'N/A'}</span></p>
                  <p><strong>Weather:</strong> <span>
                    {entry.weather?.main?.temp
                      ? `${((entry.weather.main.temp - 273.15) * 9/5 + 32).toFixed(1)}°F`
                      : 'N/A'}
                  </span></p>
                  <p><strong>Public:</strong> <span>{entry.isPublic ? 'Yes' : 'No'}</span></p>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyEntries;