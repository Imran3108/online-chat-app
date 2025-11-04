import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from '../api/client.jsx';
import { useAuth } from '../state/useAuth.jsx';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();
  const api = createApiClient(() => null);

  async function submit(e) {
    e.preventDefault();
    setError('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = mode === 'login' ? { email, password } : { email, name, password };
      const { data } = await api.post(path, body);
      setToken(data.token);
      setUser(data.user);
      navigate('/chat');
    } catch (err) {
      setError(err.response?.data?.error || 'Request failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-blue-900">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8">
        <div className="mb-4">
          <div className="text-2xl font-semibold">Online Chat</div>
          <div className="text-sm text-white/70">{mode === 'login' ? 'Sign in to continue' : 'Create your account'}</div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white/80">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="mt-1 w-full px-4 py-3 rounded-lg bg-white/5 border-2 border-white/10 focus:outline-none focus:border-blue-400 transition duration-300" />
          </div>
          {mode === 'register' && (
            <div>
              <label className="text-sm font-medium text-white/80">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="mt-1 w-full px-4 py-3 rounded-lg bg-white/5 border-2 border-white/10 focus:outline-none focus:border-blue-400 transition duration-300" />
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-white/80">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="mt-1 w-full px-4 py-3 rounded-lg bg-white/5 border-2 border-white/10 focus:outline-none focus:border-blue-400 transition duration-300" />
          </div>
          {error && <div className="text-red-400 text-sm font-medium">{error}</div>}
          <button type="submit" className="w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition duration-300">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>
        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <button className="text-blue-300 hover:text-blue-200 font-medium" onClick={() => setMode('register')}>Need an account? Register</button>
          ) : (
            <button className="text-blue-300 hover:text-blue-200 font-medium" onClick={() => setMode('login')}>Have an account? Login</button>
          )}
        </div>
      </div>
    </div>
  );
}


