import React, { useState } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import Login from './components/Login';
import MyJournal from './components/MyJournal';
import CommunityFeed from './components/CommunityFeed';
import EntryDetail from './components/EntryDetail';
import Account from './components/Account';
import MyEntries from './components/MyEntries';
import CommunityCreate from './components/CommunityCreate';
import MyCommunities from './components/MyCommunities';
import CommunityDetail from './components/CommunityDetail';
import CommunityManage from './components/CommunityManage';

const App = () => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const history = useHistory();

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    history.push('/login');
  };

  return (
    <div className="app" key={token ? 'logged-in' : 'logged-out'}>
      <Switch>
        <Route path="/login">
          <Login setToken={setToken} />
        </Route>
        <Route path="/register">
          <Login setToken={setToken} isRegisterDefault={true} />
        </Route>
        <Route path="/journal">
          {token ? <MyJournal token={token} /> : <CommunityFeed token={null} />}
        </Route>
        <Route path="/entry/:id">
          <EntryDetail token={token} />
        </Route>
        <Route path="/account">
          {token ? <Account token={token} /> : <CommunityFeed token={null} />}
        </Route>
        <Route path="/my-entries">
          {token ? <MyEntries token={token} /> : <CommunityFeed token={null} />}
        </Route>
        <Route path="/community-create">
          {token ? <CommunityCreate token={token} /> : <CommunityFeed token={null} />}
        </Route>
        <Route path="/my-communities">
          {token ? <MyCommunities token={token} /> : <CommunityFeed token={null} />}
        </Route>
        <Route path="/community-manage/:id">
          {token ? <CommunityManage token={token} /> : <CommunityFeed token={null} />}
        </Route>
        <Route path="/community/:id">
          {token ? <CommunityDetail token={token} /> : <CommunityFeed token={null} />}
        </Route>
        <Route path="/">
          <CommunityFeed token={token} />
        </Route>
      </Switch>
    </div>
  );
};

export default App;