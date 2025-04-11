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
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/journal`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEntries(res.data);
      } catch (err) {
        console.error('Error fetching entries:', err.response?.data || err.message);
        if (err.response?.status === 401) {
          handleLogout();
        }
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
    if (editorRef.current) editorRef.current.innerHTML = entry.content;
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
        if (photo instanceof File) {
          formData.append('photos', photo);
          console.log(`Appending photo ${index}:`, photo.name, photo.size);
        }
      });
    }

    if (videos.length > 0) {
      videos.forEach((video, index) => {
        if (video instanceof File) {
          formData.append('videos', video);
          console.log(`Appending video ${index}:`, video.name, video.size);
        }
      });
    }

    if (audio && (audio instanceof Blob || audio instanceof File)) {
      formData.append('audio', audio);
      console.log('Appending audio:', audio.name || 'recorded audio', audio.size);
    }

    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
    }

    try {
      let res;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      console.log('Sending request to:', editingEntry ?
        `${process.env.REACT_APP_API_URL}/api/journal/${editingEntry._id}` :
        `${process.env.REACT_APP_API_URL}/api/journal`);
      console.log('Request config:', config);

      if (editingEntry) {
        res = await axios.put(
          `${process.env.REACT_APP_API_URL}/api/journal/${editingEntry._id}`,
          formData,
          config
        );
        setEntries(entries.map((entry) =>
          entry._id === editingEntry._id ? res.data : entry
        ));
        setEditingEntry(null);
      } else {
        res = await axios.post(`${process.env.REACT_APP_API_URL}/api/journal`, formData, config);
        setEntries([...entries, res.data]);
      }

      console.log('Response:', res.data);

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
      console.error('Submission error:', {
        message: err.message,
        response: err.response ? {
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        } : 'No response received'
      });
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        alert(`Failed to ${editingEntry ? 'update' : 'add'} entry: ${err.response?.data?.error || err.message}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleCardClick = (id) => {
    history.push(`/entry/${id}`);
  };

  return (
    <div className="app-container">
      <SideNav
        token={token}
        entries={entries}
        handleLogout={handleLogout}
        handleCardClick={handleCardClick}
      />
      <main className="main-content">
        <div className="journal-container">
          <h2>My Journal</h2>
          <form onSubmit={handleSubmit} className="journal-form">
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Date (e.g., 5 April 2025)"
              required
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              required
            />
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
            <div className="location-container">
              <input
                type="text"
                value={location}
                onChange={handleLocationChange}
                placeholder="Location (auto-detected or enter manually)"
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
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              Make this entry public
            </label>
            <div className="button-container">
              <button type="submit">{editingEntry ? 'Update Entry' : 'Add Entry'}</button>
              {editingEntry && (
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="cancel-edit-btn"
                >
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