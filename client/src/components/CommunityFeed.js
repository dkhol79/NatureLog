import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import SideNav from './SideNav'; // Adjust the import path as needed

const CommunityFeed = ({ token }) => {
  const [entries, setEntries] = useState([]);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const history = useHistory();

  useEffect(() => {
    // Fetch community feed entries
    axios
      .get('http://localhost:5000/api/journal/community')
      .then(res => setEntries(res.data))
      .catch(err => console.error('Error fetching community feed:', err));

    // Fetch user's journal entries for sidebar (assuming token is available)
    if (token) {
      axios
        .get('http://localhost:5000/api/journal', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then(res => setSidebarEntries(res.data))
        .catch(err => console.error('Error fetching sidebar entries:', err));
    }
  }, [token]);

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

  return (
    <div className="app-container">
      <SideNav
        entries={sidebarEntries}
        handleLogout={handleLogout}
        handleCardClick={handleSidebarCardClick}
      />
      <main className="main-content">
        <div className="community-feed">
          <h2>Community Feed</h2>
          <div className="entries">
            {entries.length === 0 ? (
              <p>No public entries yet.</p>
            ) : (
              entries.map(entry => (
                <div
                  key={entry.id}
                  className="entry"
                  onClick={() => handleCardClick(entry.id)}
                >
                  <p className="entry-date">{new Date(entry.timestamp).toLocaleDateString()}</p>
                  <h3>{entry.title}</h3>
                  {entry.photos?.length > 0 && (
                    <img src={`http://localhost:5000/${entry.photos[0]}`} alt={entry.title} />
                  )}
                  <p><strong>Category:</strong> {entry.category}</p>
                  <p>
                    <strong>Weather:</strong>{' '}
                    {entry.weather?.main?.temp
                      ? `${(entry.weather.main.temp - 273.15).toFixed(1)}°C`
                      : 'N/A'}
                  </p>
                  <p><strong>By:</strong> {entry.username}</p>
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