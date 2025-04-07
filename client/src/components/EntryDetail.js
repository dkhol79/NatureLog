import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';
import SideNav from './SideNav'; // Adjust the import path as needed

const EntryDetail = ({ token }) => {
  const [entry, setEntry] = useState(null);
  const [entries, setEntries] = useState([]);
  const { id } = useParams();
  const history = useHistory();

  useEffect(() => {
    if (!token) history.push('/login');

    const fetchEntry = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/journal/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntry(res.data);
      } catch (err) {
        console.error('Error fetching entry:', err.response?.data || err.message);
        history.push('/journal');
      }
    };

    const fetchEntries = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/journal', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(res.data);
      } catch (err) {
        console.error('Error fetching entries:', err.response?.data || err.message);
      }
    };

    fetchEntry();
    fetchEntries();
  }, [id, token, history]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  const handleEdit = () => {
    history.push('/journal', { entryToEdit: entry });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        console.log('Attempting to delete entry with ID:', id);
        console.log('Using token:', token);
        const response = await axios.delete(`http://localhost:5000/api/journal/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('Delete response:', response.data);
        setEntries(entries.filter(e => e._id !== id));
        history.push('/journal');
      } catch (err) {
        console.error('Delete request failed:', {
          status: err.response?.status,
          data: err.response?.data,
          message: err.message,
          headers: err.response?.headers,
        });
        let errorMessage = 'Failed to delete entry. Please try again.';
        if (err.response?.status === 403) errorMessage = 'You do not have permission to delete this entry.';
        else if (err.response?.status === 404) errorMessage = 'Entry not found.';
        else if (err.response?.data?.error) errorMessage = err.response.data.error;
        alert(errorMessage);
      }
    }
  };

  if (!entry) return <div>Loading...</div>;

  return (
    <div className="app-container">
      <SideNav
        entries={entries}
        handleLogout={handleLogout}
        handleCardClick={handleCardClick}
      />
      <main className="main-content">
        <div className="entry-detail-container">
          <div className="entry-detail-header">
            <button onClick={() => history.goBack()} className="back-btn">
              Back
            </button>
            <button onClick={handleEdit} className="edit-btn">
              Edit
            </button>
            <button onClick={handleDelete} className="delete-btn">
              Delete
            </button>
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
              <audio
                controls
                src={`http://localhost:5000/${entry.audio}`}
                className="audio-player"
              />
            )}
            <div
              className="description"
              dangerouslySetInnerHTML={{ __html: entry.content }}
            />
            <div className="entry-meta">
              <p><strong>Category:</strong> {entry.category}</p>
              <p>
                <strong>Weather:</strong>{' '}
                {entry.weather?.main?.temp
                  ? `${(entry.weather.main.temp - 273.15).toFixed(1)}°C`
                  : 'N/A'}
              </p>
              <p><strong>Location:</strong> {entry.location || 'Unknown'}</p>
              <p><strong>By:</strong> {entry.username}</p>
              <p>
                <strong>Created:</strong>{' '}
                {new Date(entry.timestamp).toLocaleDateString()}
              </p>
              <p><strong>Public:</strong> {entry.isPublic ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EntryDetail;