import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isRegister ? '/api/auth/register' : '/api/auth/login';
    const data = isRegister ? { email, password, username } : { email, password };
    try {
      const res = await axios.post(`http://localhost:5000${url}`, data);
      setToken(res.data.token);
      localStorage.setItem('token', res.data.token);
      window.location.href = '/journal';
    } catch (err) {
      alert(err.response.data.error);
    }
  };

  return (
    <div className="login">
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        {isRegister && <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required />}
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Switch to Login' : 'Switch to Register'}
      </button>
    </div>
  );
};

export default Login;