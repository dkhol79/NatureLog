import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useHistory } from 'react-router-dom';
import SideNav from './SideNav';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome

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

  const prepareContentForEditing = (htmlContent) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const images = doc.querySelectorAll('img');
    images.forEach(img => {
      if (img.parentElement.className === 'resizable-image-container') return;

      const container = doc.createElement('div');
      container.className = 'resizable-image-container';

      const resizeHandles = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
      resizeHandles.forEach(position => {
        const handle = doc.createElement('div');
        handle.className = `resize-handle ${position}`;
        container.appendChild(handle);
      });

      img.parentNode.insertBefore(container, img);
      container.appendChild(img);
    });

    return doc.body.innerHTML;
  };

  const handleEdit = () => {
    const editableContent = prepareContentForEditing(entry.content);
    history.push('/journal', { entryToEdit: { ...entry, content: editableContent } });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await axios.delete(`http://localhost:5000/api/journal/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(entries.filter(e => e._id !== id));
        history.push('/journal');
      } catch (err) {
        console.error('Delete request failed:', err.response?.data || err.message);
        let errorMessage = 'Failed to delete entry. Please try again.';
        if (err.response?.status === 403) errorMessage = 'You do not have permission to delete this entry.';
        else if (err.response?.status === 404) errorMessage = 'Entry not found.';
        alert(errorMessage);
      }
    }
  };

  if (!entry) return <div className="loading">Loading...</div>;

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
            {entry.weather && (
              <div className="weather-details">
                <h3>
                  Weather Conditions{' '}
                  <span className="cloud-cover-title">
                    <i className="fas fa-cloud weather-icon"></i>{' '}
                    {entry.weather.clouds?.all || 'N/A'}%
                  </span>
                </h3>
                <div className="weather-columns">
                  <div className="weather-column">
                    <div className="weather-card">
                      <p>
                        <i className="fas fa-cloud-sun weather-icon"></i>
                        <strong>Main:</strong> <span>{entry.weather.weather[0]?.main || 'N/A'}</span>
                      </p>
                      <p>
                        <i className="fas fa-info-circle weather-icon"></i>
                        <strong>Description:</strong> <span>{entry.weather.weather[0]?.description || 'N/A'}</span>
                      </p>
                      <p>
                        <i className="fas fa-thermometer-half weather-icon"></i>
                        <strong>Temperature:</strong> <span>{((entry.weather.main?.temp - 273.15) * 9/5 + 32).toFixed(1)}°F</span>
                      </p>
                      <p>
                        <i className="fas fa-temperature-low weather-icon"></i>
                        <strong>Feels Like:</strong> <span>{((entry.weather.main?.feels_like - 273.15) * 9/5 + 32).toFixed(1)}°F</span>
                      </p>
                      <p>
                        <i className="fas fa-temperature-down weather-icon"></i>
                        <strong>Min Temp:</strong> <span>{((entry.weather.main?.temp_min - 273.15) * 9/5 + 32).toFixed(1)}°F</span>
                      </p>
                      <p>
                        <i className="fas fa-temperature-up weather-icon Kft"></i>
                        <strong>Max Temp:</strong> <span>{((entry.weather.main?.temp_max - 273.15) * 9/5 + 32).toFixed(1)}°F</span>
                      </p>
                    </div>
                  </div>
                  <div className="weather-column">
                    <div className="weather-card">
                      <p>
                        <i className="fas fa-tachometer-alt weather-icon"></i>
                        <strong>Pressure:</strong> <span>{(entry.weather.main?.pressure * 0.02953).toFixed(2) || 'N/A'} inHg</span>
                      </p>
                      <p>
                        <i className="fas fa-tint weather-icon"></i>
                        <strong>Humidity:</strong> <span>{entry.weather.main?.humidity || 'N/A'}%</span>
                      </p>
                      <p>
                        <i className="fas fa-eye weather-icon"></i>
                        <strong>Visibility:</strong> <span>{entry.weather.visibility ? (entry.weather.visibility / 1609.34).toFixed(1) + ' mi' : 'N/A'}</span>
                      </p>
                      <p>
                        <i className="fas fa-wind weather-icon"></i>
                        <strong>Wind Speed:</strong> <span>{(entry.weather.wind?.speed * 2.23694).toFixed(1) || 'N/A'} mph</span>
                      </p>
                      <p>
                        <i className="fas fa-compass weather-icon" style={{ transform: `rotate(${entry.weather.wind?.deg || 0}deg)` }}></i>
                        <strong>Wind Direction:</strong> <span>{entry.weather.wind?.deg || 'N/A'}°</span>
                      </p>
                      <p>
                        <i className="fas fa-wind weather-icon wind-gust"></i>
                        <strong>Wind Gust:</strong> <span>{entry.weather.wind?.gust ? (entry.weather.wind.gust * 2.23694).toFixed(1) + ' mph' : 'N/A'}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
              <p><strong>Location:</strong> {entry.location || 'Unknown'}</p>
              <p><strong>By:</strong> {entry.username}</p>
              <p><strong>Created:</strong> {new Date(entry.timestamp).toLocaleDateString()}</p>
              <p><strong>Public:</strong> {entry.isPublic ? 'Yes' : 'No'}</p>
            </div>
            <button onClick={handleDelete} className="delete-btn">Delete</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EntryDetail;