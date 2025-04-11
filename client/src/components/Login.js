import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import '../styles.css';

const Login = ({ setToken, isRegisterDefault = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(isRegisterDefault);
  const [error, setError] = useState('');
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const payload = isRegister ? { email, password, username } : { email, password };
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth${endpoint}`, payload);
      const { token } = res.data;

      localStorage.setItem('token', token);
      setToken(token);
      history.push('/journal');
    } catch (err) {
      console.error('Auth error:', err.response?.data || err.message);
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="login">
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {isRegister && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Switch to Login' : 'Switch to Register'}
      </button>
    </div>
  );
};

export default Login;