import React, { useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import '../styles.css';

const Login = ({ setToken, isRegisterDefault = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(isRegisterDefault);
  const history = useHistory();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/register' : '/login';
      const payload = isRegister ? { email, password, username } : { email, password };
      const res = await axios.post(`http://localhost:5000/api/auth${endpoint}`, payload);
      const { token } = res.data;

      // Store token in localStorage
      localStorage.setItem('token', token);
      // Update token in App.js state
      setToken(token);
      // Redirect to the journal page
      history.push('/journal');
    } catch (err) {
      console.error('Auth error:', err.response?.data || err.message);
      alert('Authentication failed. Please try again.');
    }
  };

  return (
    <div className="login">
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
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