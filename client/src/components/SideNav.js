import React from 'react';
import { useHistory } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Logo from '../assets/NatureLog-Logo.png';

const SideNav = ({
  token,
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

  if (!token) {
    return (
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={Logo} alt="NatureLog Logo" />
        </div>
        <nav className="sidebar-nav">
          <button
            className="sidebar-btn"
            onClick={() => history.push('/login')}
          >
            Log In
          </button>
          <button
            className="sidebar-btn"
            onClick={() => history.push('/register')} // Fixed to navigate to /register
          >
            Sign Up
          </button>
        </nav>
        <div className="sidebar-footer">
          <p>© 2025 NatureLog</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
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
          className="logout-btn"
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
        <p>© 2025 NatureLog</p>
      </div>
    </aside>
  );
};

export default SideNav;