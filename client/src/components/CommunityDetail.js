import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useHistory, useParams } from 'react-router-dom';
import SideNav from './SideNav';
import '@fortawesome/fontawesome-free/css/all.min.css';

const CommunityDetail = ({ token }) => {
  const { id } = useParams();
  const [community, setCommunity] = useState(null);
  const [sidebarEntries, setSidebarEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const history = useHistory();

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/communities/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCommunity(res.data);
        setIsAdmin(res.data.isAdmin);
      } catch (err) {
        console.error('Error fetching community:', err.response?.data || err.message);
      }
    };

    const fetchSidebarEntries = async () => {
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
      await Promise.all([fetchCommunity(), fetchSidebarEntries()]);
      setLoading(false);
    };

    fetchData();
  }, [id, token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    history.push('/login');
  };

  const handleSidebarCardClick = (entryId) => {
    history.push(`/entry/${entryId}`);
  };

  const handleManageClick = () => {
    history.push(`/community-manage/${id}`);
  };

  if (loading || !community) return <div className="loading">Loading...</div>;

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
          <div className="community-header">
            <h2>{community.name}</h2>
            {isAdmin && (
              <button onClick={handleManageClick} className="manage-btn">
                Manage
              </button>
            )}
          </div>
          <div className="community-meta">
            <p>
              <strong>Members:</strong> {community.members.length} |{' '}
              <strong>Admin:</strong> {community.adminUsername} |{' '}
              <strong>Description:</strong> {community.description || 'No description'}
            </p>
          </div>
          <div className="community-details">
            <p>
              <strong>Categories:</strong>{' '}
              {Object.keys(community.categories)
                .filter((cat) => community.categories[cat])
                .join(', ') || 'None'}
            </p>
            <p>
              <strong>Type:</strong>{' '}
              {community.communityType.charAt(0).toUpperCase() +
                community.communityType.slice(1)}
            </p>
            {community.isMature && (
              <p>
                <strong>Mature:</strong> 18+
              </p>
            )}
            <p>
              <strong>Rules:</strong> {community.rules || 'None'}
            </p>
            <p>
              <strong>Created:</strong>{' '}
              {new Date(community.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="community-content">
            <h3>Community Content</h3>
            <p>No posts available yet. Check back later!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CommunityDetail;