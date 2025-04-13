import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import SideNav from './SideNav';

const CommunityCreate = ({ token }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState({
    Plants: false,
    Wildlife: false,
    Weather: false,
    'Scenic Views': false,
    Birds: false,
    Geology: false,
    'Water Bodies': false,
  });
  const [rules, setRules] = useState('');
  const [communityType, setCommunityType] = useState('public');
  const [isMature, setIsMature] = useState(false);
  const [error, setError] = useState(null);
  const [entries, setEntries] = useState([]);
  const history = useHistory();

  const handleCategoryChange = (category) => {
    setCategories({ ...categories, [category]: !categories[category] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Community name is required');
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/communities`,
        {
          name,
          description,
          categories,
          rules,
          communityType,
          isMature,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setError(null);
      history.push('/my-communities');
    } catch (err) {
      console.error('Error creating community:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Failed to create community');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  if (!token) {
    history.push('/login');
    return null;
  }

  return (
    <div className="app-container">
      <SideNav
        token={token}
        entries={entries}
        handleLogout={handleLogout}
        handleCardClick={handleCardClick}
      />
      <main className="main-content">
        <div className="community-create-container">
          <h2>Create a New Community</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit} className="community-form">
            <div className="form-group">
              <label>Community Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter community name"
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your community"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Categories:</label>
              <div className="categories-grid">
                {Object.keys(categories).map((category) => (
                  <div key={category}>
                    <input
                      type="checkbox"
                      checked={categories[category]}
                      onChange={() => handleCategoryChange(category)}
                    />
                    <label>{category}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Rules:</label>
              <textarea
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="List community rules"
                rows="4"
              />
            </div>
            <div className="form-group">
              <label>Community Type:</label>
              <select value={communityType} onChange={(e) => setCommunityType(e.target.value)}>
                <option value="public">Public (Anyone can view and contribute)</option>
                <option value="restricted">Restricted (Anyone can view, restricted contributions)</option>
                <option value="private">Private (Only approved members can view and contribute)</option>
              </select>
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={isMature}
                  onChange={(e) => setIsMature(e.target.checked)}
                />
                Mature (18+) Content
              </label>
            </div>
            <div className="button-group">
              <button type="submit">Create Community</button>
              <button type="button" onClick={() => history.push('/account')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CommunityCreate;