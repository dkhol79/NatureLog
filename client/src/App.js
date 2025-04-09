import React, { useState, useEffect } from 'react';
import { Route, Switch, Redirect, useHistory } from 'react-router-dom';
import Login from './components/Login';
import MyJournal from './components/MyJournal';
import CommunityFeed from './components/CommunityFeed';
import EntryDetail from './components/EntryDetail';
import Account from './components/Account';
import SideNav from './components/SideNav';

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);  // This will trigger a re-render
  };

  useEffect(() => {
    if (!token) {
      history.push('/login');
    }
  }, [token, history]);

  return (
    <div className="app" key={token ? 'logged-in' : 'logged-out'}>
      {token && (
        <SideNav
          handleLogout={handleLogout}  // Ensure it's passed down properly
          entries={[]}  // Use your actual entries here
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
  );
};

export default App;
