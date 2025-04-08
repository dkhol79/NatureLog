import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import SideNav from './SideNav'; // Adjust the import path as needed

const CommunityFeed = ({ token }) => {
  const [entries, setEntries] = useState([]);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [loading, setLoading] = useState(true); // Added loading state for better UX
  const history = useHistory();

  useEffect(() => {
    // Check token and redirect if missing
    if (!token) {
      history.push('/login');
      return;
    }

    const fetchCommunityEntries = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/journal/community', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(res.data);
      } catch (err) {
        console.error('Error fetching community feed:', err.response?.data || err.message);
      }
    };

    const fetchSidebarEntries = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/journal', {
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
  }, [token, history]);

  const handleCardClick = (id) => {
    history.push(`/entry/${id}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleSidebarCardClick = (entryId) => {
    // Ensure token exists before navigating
    if (!token) {
      console.error('No token found, redirecting to login');
      history.push('/login');
      return;
    }
    console.log('Navigating to entry:', entryId); // Debug log
    history.push(`/entry/${entryId}`);
  };

  if (loading) return <div>Loading...</div>;

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
                  key={entry._id}
                  className="entry"
                  onClick={() => handleCardClick(entry._id)}
                >
                  <p className="entry-date">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </p>
                  <h3>{entry.title}</h3>
                  {entry.photos?.length > 0 && (
                    <img
                      src={`http://localhost:5000/${entry.photos[0]}`}
                      alt={entry.title}
                    />
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