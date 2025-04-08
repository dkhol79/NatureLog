import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './components/Login';
import MyJournal from './components/MyJournal';
import CommunityFeed from './components/CommunityFeed';
import EntryDetail from './components/EntryDetail';
import Account from './components/Account';
import SideNav from './components/SideNav';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && storedToken !== token) {
      setToken(storedToken);
    } else if (!storedToken && token) {
      setToken(null);
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      {/* Force rerender when token changes */}
      <div className="app" key={token ? 'logged-in' : 'logged-out'}>
        {token && (
          <SideNav
            handleLogout={handleLogout}
            entries={[]}
            handleCardClick={() => {}}
          />
        )}
        <main>
          <Switch>
            <Route path="/login">
              <Login setToken={setToken} />
            </Route>
            <Route path="/register">
              <Login setToken={setToken} isRegisterDefault={true} />
            </Route>
            <Route path="/journal">
              {token ? <MyJournal token={token} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/entry/:id">
              {token ? <EntryDetail token={token} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/account">
              {token ? <Account token={token} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/">
              {token ? <CommunityFeed token={token} /> : <Redirect to="/login" />}
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
};

export default App;
