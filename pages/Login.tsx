import React, { useState } from 'react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

interface LoginProps {
  onCreateLobby: (name: string) => void;
  onJoinLobby: (name: string, lobbyId: string) => void;
}

const Login: React.FC<LoginProps> = ({ onCreateLobby, onJoinLobby }) => {
  const [name, setName] = useState('');
  const [lobbyId, setLobbyId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const validateAndSetError = (message: string) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() === '') {
      validateAndSetError('الرجاء إدخال اسم.');
      return;
    }
    if (isJoining) {
      if (lobbyId.trim() === '') {
        validateAndSetError('الرجاء إدخال رمز اللوبي.');
        return;
      }
      onJoinLobby(name, lobbyId);
    } else {
      onCreateLobby(name);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center mb-8">
             <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-2">
                Jeopardy بالعربي
            </h1>
            <p className="text-xl text-slate-400">لعبة التحدي والمعرفة</p>
        </div>
        <Card className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-center text-white mb-6">{isJoining ? 'الانضمام إلى لوبي' : 'إنشاء لوبي جديد'}</h2>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="أدخل اسمك"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-center text-lg"
              />
              {isJoining && (
                <Input
                  type="text"
                  placeholder="أدخل رمز اللوبي"
                  value={lobbyId}
                  onChange={(e) => setLobbyId(e.target.value.toUpperCase())}
                  required
                  className="text-center text-lg tracking-widest"
                />
              )}
            </div>
            {error && (
              <p className="text-red-400 text-center mt-4 bg-red-900/50 p-2 rounded-md transition-opacity duration-300">
                {error}
              </p>
            )}
            <div className="mt-6 space-y-3">
              <Button type="submit" className="w-full" size="lg">
                {isJoining ? 'انضم الآن' : 'أنشئ اللوبي'}
              </Button>
              <Button type="button" variant="secondary" className="w-full" onClick={() => setIsJoining(!isJoining)}>
                {isJoining ? 'العودة إلى إنشاء لوبي' : 'الانضمام إلى لوبي موجود'}
              </Button>
            </div>
          </form>
        </Card>
    </div>
  );
};

export default Login;
