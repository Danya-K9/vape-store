import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setToken } from '../lib/api';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setToken(token);
    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((user) => {
        login(token, user);
        navigate('/profile');
      })
      .catch(() => {
        setToken(null);
        navigate('/login');
      });
  }, [searchParams, navigate, login]);

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p>Вход выполняется...</p>
    </div>
  );
}
