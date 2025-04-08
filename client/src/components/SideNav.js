import React from 'react';
import { useHistory } from 'react-router-dom';

const SideNav = ({ entries, handleLogout, handleCardClick }) => {
  const history = useHistory();

  const onLogout = () => {
    if (typeof handleLogout === 'function') { // Add a safety check
      handleLogout(); // Call the parent's logout function to clear token
    } else {
      console.error('handleLogout is not a function');
    }
    history.push('/login'); // Redirect to login page
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <button className="sidebar-btn" onClick={() => history.push('/journal')}>
          My Journal
        </button>
        <button className="sidebar-btn" onClick={() => history.push('/')}>
          Community Feed
        </button>
        <button className="sidebar-btn" onClick={() => history.push('/account')}>
          Account
        </button>
        <button className="logout-btn" onClick={onLogout}>
          Log Out
        </button>
      </nav>
      <div className="sidebar-entries">
        <h3>Entries</h3>
        {entries.length > 0 ? (
          entries.map(entry => (
            <div
              key={entry._id}
              className="sidebar-entry"
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
    </aside>
  );
};

export default SideNav;