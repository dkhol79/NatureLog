import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';

const EntryDetail = ({ token }) => {
  const [entry, setEntry] = useState(null);
  const [entries, setEntries] = useState([]); // For sidebar
  const { id } = useParams();
  const history = useHistory();

  useEffect(() => {
    if (!token) history.push('/login');

    // Fetch the specific entry
    axios
      .get(`http://localhost:5000/api/journal/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setEntry(res.data))
      .catch(err => {
        console.error('Error fetching entry:', err);
        history.push('/journal');
      });

    // Fetch all entries for sidebar
    axios
      .get('http://localhost:5000/api/journal', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => setEntries(res.data));
  }, [id, token, history]);

  const handleEdit = () => {
    history.push('/journal', { entryToEdit: entry });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  if (!entry) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button className="sidebar-btn" onClick={() => history.push('/journal')}>
            My Journal
          </button>
          <button className="sidebar-btn" onClick={() => history.push('/')}>
            Community Feed
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </nav>
        <div className="sidebar-entries">
          <h3>Entries</h3>
          {entries.map(entry => (
            <div
              key={entry.id}
              className="sidebar-entry"
              onClick={() => handleCardClick(entry.id)}
            >
              <p className="entry-date">{entry.date}</p>
              <h4>{entry.title}</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  history.push('/journal', { entryToEdit: entry });
                }}
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </aside>
      <main className="main-content">
        <div className="entry-detail-container">
          <div className="entry-detail-header">
            <button onClick={() => history.goBack()} className="back-btn">Back</button>
            <button onClick={handleEdit} className="edit-btn">Edit</button>
          </div>
          <div className="entry-detail-content">
            <p className="entry-date">{entry.date}</p>
            <h2>{entry.title}</h2>
            {entry.photos?.length > 0 && (
              <div className="media-gallery">
                {entry.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={`http://localhost:5000/${photo}`}
                    alt={`${entry.title} ${index}`}
                    className="media-item"
                  />
                ))}
              </div>
            )}
            {entry.videos?.length > 0 && (
              <div className="media-gallery">
                {entry.videos.map((video, index) => (
                  <video
                    key={index}
                    controls
                    src={`http://localhost:5000/${video}`}
                    className="media-item"
                  />
                ))}
              </div>
            )}
            {entry.audio && (
              <audio controls src={`http://localhost:5000/${entry.audio}`} className="audio-player" />
            )}
            {/* Render content as HTML */}
            <div
              className="description"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
            <div className="entry-meta">
              <p><strong>Category:</strong> {entry.category}</p>
              <p><strong>Weather:</strong> {entry.weather?.main.temp ? `${(entry.weather.main.temp - 273.15).toFixed(1)}°C` : 'N/A'}</p>
              <p><strong>Location:</strong> {entry.location || 'Unknown'}</p>
              <p><strong>By:</strong> {entry.username}</p>
              <p><strong>Created:</strong> {new Date(entry.timestamp).toLocaleDateString()}</p>
              <p><strong>Public:</strong> {entry.isPublic ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EntryDetail;