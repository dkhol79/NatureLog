import React from 'react';
import { useHistory } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Font Awesome import
import Logo from '../assets/NatureLog-Logo.png'; // Adjust the import path as needed

const SideNav = ({
  entries = [],
  handleLogout = () => {},
  handleCardClick = () => {},
  selectedEntryId = null,
}) => {
  const history = useHistory();
  const currentPath = history.location.pathname;

  const onLogoutClick = () => {
    handleLogout();
    history.push('/login');
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {/* Logo above My Journal */}
        <div className="sidebar-logo">
          <img src={Logo} alt="NatureLog Logo" />
        </div>
        <button
          className={`sidebar-btn ${currentPath === '/journal' ? 'active' : ''}`}
          onClick={() => history.push('/journal')}
        >
          <i className="fa fa-book"></i> My Journal
        </button>
        <button
          className={`sidebar-btn ${currentPath === '/' ? 'active' : ''}`}
          onClick={() => history.push('/')}
        >
          <i className="fa fa-users"></i> Community Feed
        </button>
        <button
          className={`sidebar-btn ${currentPath === '/account' ? 'active' : ''}`}
          onClick={() => history.push('/account')}
        >
          <i className="fa fa-user"></i> Account
        </button>
        <button
          className={`logout-btn ${currentPath === '/login' ? 'active' : ''}`}
          onClick={onLogoutClick}
        >
          <i className="fa fa-sign-out"></i> Log Out
        </button>
      </nav>
      <div className="sidebar-entries">
        <h3>Entries</h3>
        {entries.length > 0 ? (
          entries.map(entry => (
            <div
              key={entry._id}
              className={`sidebar-entry ${selectedEntryId === entry._id ? 'active' : ''}`}
              onClick={() => handleCardClick(entry._id)}
            >
              <p className="entry-date">{entry.date}</p>
              <h4>{entry.title}</h4>
            </div>
          ))
        ) : (
          <p>No entries found.</p>
        )}
      </div>
      <div className="sidebar-footer">
        <p>&copy; 2025 NatureLog</p>
      </div>
    </aside>
  );
};

export default SideNav;