import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import SideNav from './SideNav';
import TextEditor from './TextEditor';

const MyJournal = ({ token }) => {
  const [entries, setEntries] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Wildlife');
  const [location, setLocation] = useState('');
  const [locationData, setLocationData] = useState({ lat: '', lng: '', address: '' });
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [isLocationDenied, setIsLocationDenied] = useState(false);
  const [userCoords, setUserCoords] = useState({ lat: null, lng: null });
  const [isPublic, setIsPublic] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [audio, setAudio] = useState(null);
  const [date, setDate] = useState(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  const [editingEntry, setEditingEntry] = useState(null);
  const history = useHistory();
  const editorRef = useRef(null);

  const categories = [
    'Wildlife', 'Plants', 'Scenic Views', 'Weather', 'Birds', 'Geology', 'Water Bodies',
  ];

  useEffect(() => {
    if (!token) {
      history.push('/login');
      return;
    }

    if (history.location.state?.entryToEdit) {
      handleEdit(history.location.state.entryToEdit);
      history.replace({ ...history.location, state: undefined });
    }

    const fetchLocation = async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const address = response.data.display_name;
        setLocation(address);
        setLocationData({ lat: latitude.toString(), lng: longitude.toString(), address });
        setIsLocationDenied(false);
      } catch (err) {
        console.error('Geocoding error:', err);
        setLocation('Location not available');
      }
    };

    navigator.geolocation.getCurrentPosition(
      fetchLocation,
      (err) => {
        console.error('Geolocation error:', err);
        setLocation('Location access denied');
        setIsLocationDenied(true);
      },
      { enableHighAccuracy: true }
    );

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

    fetchEntries();
  }, [token, history]);

  const handleLocationChange = async (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);

    if (newLocation.length > 2) {
      try {
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(newLocation)}`;
        if (userCoords.lat && userCoords.lng) {
          url += `&lat=${userCoords.lat}&lon=${userCoords.lng}`;
        }
        const response = await axios.get(url);
        setLocationSuggestions(response.data.slice(0, 5));
      } catch (err) {
        console.error('Location search error:', err);
        setLocationSuggestions([]);
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleSuggestionSelect = (suggestion) => {
    const selectedLocation = suggestion.display_name;
    setLocation(selectedLocation);
    setLocationData({
      lat: suggestion.lat,
      lng: suggestion.lon,
      address: selectedLocation,
    });
    setLocationSuggestions([]);
  };

  const handleAllowLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const address = response.data.display_name;
          setLocation(address);
          setLocationData({ lat: latitude.toString(), lng: longitude.toString(), address });
          setIsLocationDenied(false);
        } catch (err) {
          console.error('Geocoding error:', err);
          setLocation('Location not available');
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Please enable location access in your browser settings');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setCategory(entry.category);
    setLocation(entry.location || '');
    setLocationData({
      lat: entry.geolocation?.lat?.toString() || '',
      lng: entry.geolocation?.lng?.toString() || '',
      address: entry.location || '',
    });
    setIsPublic(entry.isPublic);
    setDate(entry.date);
    if (entry.photos) setPhotos(entry.photos.map(photo => photo));
    if (entry.videos) setVideos(entry.videos.map(video => video));
    if (entry.audio) setAudio(entry.audio);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (title.length < 3) {
      alert('Title must be at least 3 characters');
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('category', category);
    formData.append('location', location);
    formData.append('isPublic', isPublic);
    formData.append('date', date);
    if (locationData.lat && locationData.lng) {
      formData.append('lat', parseFloat(locationData.lat));
      formData.append('lng', parseFloat(locationData.lng));
    }

    if (photos.length > 0) {
      photos.forEach((photo, index) => {
        if (photo instanceof File) formData.append('photos', photo);
      });
    }

    if (videos.length > 0) {
      videos.forEach((video, index) => {
        if (video instanceof File) formData.append('videos', video);
      });
    }

    if (audio && (audio instanceof Blob || audio instanceof File)) {
      formData.append('audio', audio);
    }

    try {
      let res;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      if (editingEntry) {
        res = await axios.put(
          `http://localhost:5000/api/journal/${editingEntry._id}`,
          formData,
          config
        );
        setEntries(entries.map((entry) =>
          entry._id === editingEntry._id ? res.data : entry
        ));
        setEditingEntry(null);
      } else {
        res = await axios.post('http://localhost:5000/api/journal', formData, config);
        setEntries([...entries, res.data]);
      }

      setTitle('');
      setContent('');
      setIsPublic(false);
      setPhotos([]);
      setVideos([]);
      setAudio(null);
      setDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      setLocation('');
      setLocationData({ lat: '', lng: '', address: '' });
    } catch (err) {
      console.error('Submission error:', err.response?.data || err.message);
      alert(`Failed to ${editingEntry ? 'update' : 'add'} entry: ${err.response?.data?.error || err.message}`);
    }
  };

  return (
    <div className="app-container">
      <SideNav
        token={token}
        entries={entries}
        handleLogout={() => { localStorage.removeItem('token'); history.push('/login'); }}
        handleCardClick={(id) => history.push(`/entry/${id}`)}
      />
      <main className="main-content">
        <div className="journal-container">
          <div className="journal-header">
            <h2>My Journal</h2>
          </div>
          <form onSubmit={handleSubmit} className="journal-form">
            <div className="form-grid">
              <div>
                <label>Date</label>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="e.g., 5 April 2025"
                  required
                />
              </div>
              <div>
                <label>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter title"
                  required
                />
              </div>
              <div className="full-width">
                <label>Content</label>
                <TextEditor
                  content={content}
                  setContent={setContent}
                  photos={photos}
                  setPhotos={setPhotos}
                  videos={videos}
                  setVideos={setVideos}
                  audio={audio}
                  setAudio={setAudio}
                />
              </div>
              <div>
                <label>Location</label>
                <div className="location-container">
                  <input
                    type="text"
                    value={location}
                    onChange={handleLocationChange}
                    placeholder="Enter or auto-detect location"
                    required
                    autoComplete="off"
                  />
                  {isLocationDenied && (
                    <button
                      type="button"
                      onClick={handleAllowLocation}
                      className="allow-location-btn"
                    >
                      Allow Location
                    </button>
                  )}
                  {locationSuggestions.length > 0 && (
                    <ul className="location-suggestions">
                      {locationSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          className="suggestion-item"
                          onClick={() => handleSuggestionSelect(suggestion)}
                        >
                          {suggestion.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              <div>
                <label>Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="checkbox-container">
                <label>
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  Make this entry public
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit">{editingEntry ? 'Update Entry' : 'Add Entry'}</button>
              {editingEntry && (
                <button type="button" onClick={() => setEditingEntry(null)}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default MyJournal;