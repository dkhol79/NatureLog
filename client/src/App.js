import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, Redirect } from 'react-router-dom';
import Login from './components/Login';
import MyJournal from './components/MyJournal';
import CommunityFeed from './components/CommunityFeed';
import EntryDetail from './components/EntryDetail';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken !== token) setToken(storedToken);
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    // Redirect to login after logout
    window.location.href = '/login';
  };

  return (
    <Router>
      <div className="app">
        <header>
          <h1>NatureLog</h1>
          <nav>
            {token ? (
              <>
                <Link to="/journal">My Journal</Link>
                <Link to="/">Community Feed</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login">Log In</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </nav>
        </header>
        <main>
          <Switch>
            <Route path="/login">
              <Login setToken={setToken} />
            </Route>
            <Route path="/register">
              <Login setToken={setToken} isRegisterDefault={true} />
            </Route>
            <Route path="/journal">
              {token ? <MyJournal token={token} handleLogout={handleLogout} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/entry/:id">
              {token ? <EntryDetail token={token} /> : <Redirect to="/login" />}
            </Route>
            <Route path="/">
              {token ? <CommunityFeed /> : <Redirect to="/login" />}
            </Route>
          </Switch>
        </main>
      </div>
    </Router>
  );
};

export default App;