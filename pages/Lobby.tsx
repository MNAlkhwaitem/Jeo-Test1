import React, { useState, useEffect } from 'react';
import { Player, LobbySettings, Ultimate } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { generateCategories } from '../services/geminiService';

interface LobbyProps {
  currentUser: Player;
  players: Player[];
  lobbyId: string;
  settings: LobbySettings;
  setSettings: React.Dispatch<React.SetStateAction<LobbySettings>>;
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  onStartPreGame: () => void;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const Lobby: React.FC<LobbyProps> = ({ currentUser, players, lobbyId, settings, setSettings, setPlayers, onStartPreGame, categories, setCategories }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(currentUser.name);

  const inviteLink = `${window.location.host}/?join=${lobbyId}`;

  useEffect(() => {
    // Adjust categories array when board size changes
    if (categories.length !== settings.boardSize) {
      const newCategories = Array.from({ length: settings.boardSize }).map((_, i) => categories[i] || '');
      setCategories(newCategories);
    }
  }, [settings.boardSize, categories, setCategories]);
  
  const handleReadyToggle = () => {
    setPlayers(prev => 
      prev.map(p => p.id === currentUser.id ? { ...p, isReady: !p.isReady } : p)
    );
  };
  
  const handleKickPlayer = (playerId: string) => {
    setPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const handleGenCategories = async () => {
    setIsGenerating(true);
    try {
        const newCategories = await generateCategories(settings.boardSize);
        setCategories(newCategories);
    } catch(e) {
        console.error(e)
    } finally {
        setIsGenerating(false);
    }
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const handleUltimateChange = (index: number, field: 'name' | 'description', value: string) => {
    const newUltimates = [...settings.customUltimates];
    newUltimates[index] = { ...newUltimates[index], [field]: value };
    setSettings(prev => ({ ...prev, customUltimates: newUltimates }));
  };

  const handleAddUltimate = () => {
    const newUltimate: Ultimate = { name: '', description: '' };
    setSettings(prev => ({ ...prev, customUltimates: [...prev.customUltimates, newUltimate] }));
  };

  const handleRemoveUltimate = (index: number) => {
    setSettings(prev => ({ ...prev, customUltimates: prev.customUltimates.filter((_, i) => i !== index) }));
  };

  const handleAssignUltimate = (playerId: string, ultimateName: string) => {
    const ultimate = settings.customUltimates.find(u => u.name === ultimateName) || null;
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, ultimate } : p));
  };
  
  const handleStartGame = () => {
    const validUltimates = settings.customUltimates.filter(u => u.name.trim() !== '');

    if (settings.useUltimates && settings.randomizeUltimates) {
        const shuffledUltimates = [...validUltimates].sort(() => 0.5 - Math.random());
        setPlayers(prevPlayers => prevPlayers.map((p, i) => ({
            ...p,
            ultimate: shuffledUltimates.length > 0 ? shuffledUltimates[i % shuffledUltimates.length] : null
        })));
    } else if (!settings.useUltimates) {
        setPlayers(prevPlayers => prevPlayers.map(p => ({ ...p, ultimate: null })));
    }
    // For manual assignment, the state is already set by handleAssignUltimate
    onStartPreGame();
  };

  const handleNameSave = () => {
    if (editedName.trim() === '') {
        setEditedName(currentUser.name); // Revert if empty
    } else {
        setPlayers(prev => 
            prev.map(p => 
                p.id === currentUser.id ? { ...p, name: editedName.trim() } : p
            )
        );
    }
    setIsEditingName(false);
  };

  const allPlayersReady = players.every(p => p.isReady);
  const categoriesSet = categories.length === settings.boardSize && categories.every(c => c.trim() !== '');

  const renderGMView = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
            <h3 className="text-xl font-bold mb-4 text-indigo-300">إعدادات اللعبة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="text-sm text-slate-400">حجم اللوحة (N x N)</label>
                  <Input type="number" min="3" max="7" value={settings.boardSize} onChange={e => setSettings({...settings, boardSize: parseInt(e.target.value)})} />
              </div>
              <div>
                  <label className="text-sm text-slate-400">الحد الأقصى للاعبين</label>
                  <Input type="number" min="2" max="10" value={settings.maxPlayers} onChange={e => setSettings({...settings, maxPlayers: parseInt(e.target.value)})} />
              </div>
              <div className="md:col-span-2 flex items-center space-x-3 rtl:space-x-reverse bg-gray-900/50 p-3 rounded-lg">
                  <input type="checkbox" id="ultimates" className="h-5 w-5" checked={settings.useUltimates} onChange={e => setSettings({...settings, useUltimates: e.target.checked})} />
                  <label htmlFor="ultimates" className="font-semibold">تضمين القدرات الخاصة (Ultimates)</label>
              </div>
            </div>
        </Card>

        {settings.useUltimates && (
            <Card>
                <h3 className="text-xl font-bold mb-4 text-indigo-300">إدارة القدرات الخاصة</h3>
                <div className="flex items-center space-x-3 rtl:space-x-reverse bg-gray-900/50 p-3 rounded-lg mb-4">
                  <input type="checkbox" id="randomizeUltimates" className="h-5 w-5" checked={settings.randomizeUltimates} onChange={e => setSettings({...settings, randomizeUltimates: e.target.checked})} />
                  <label htmlFor="randomizeUltimates" className="font-semibold">تعيين القدرات بشكل عشوائي</label>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {settings.customUltimates.map((u, index) => (
                        <div key={index} className="bg-gray-900/70 p-3 rounded-lg space-y-2">
                            <Input value={u.name} placeholder="اسم القدرة" onChange={e => handleUltimateChange(index, 'name', e.target.value)} />
                            <textarea value={u.description} placeholder="وصف القدرة" onChange={e => handleUltimateChange(index, 'description', e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm" rows={2}></textarea>
                            <Button variant="danger" size="sm" onClick={() => handleRemoveUltimate(index)}>إزالة</Button>
                        </div>
                    ))}
                </div>
                <Button onClick={handleAddUltimate} className="mt-4 w-full">إضافة قدرة جديدة</Button>
            </Card>
        )}
        
        <Card>
            <h3 className="text-xl font-bold mb-4 text-indigo-300">فئات الأسئلة ({categories.filter(c=>c.trim()!=='').length}/{settings.boardSize})</h3>
            <div className="space-y-2">
              {Array.from({ length: settings.boardSize }).map((_, index) => (
                <Input key={index} value={categories[index] || ''} placeholder={`الفئة ${index + 1}`} onChange={e => {
                  const newCats = [...categories];
                  newCats[index] = e.target.value;
                  setCategories(newCats);
                }} />
              ))}
            </div>
            <Button onClick={handleGenCategories} disabled={isGenerating} className="mt-4 w-full">
              {isGenerating ? 'جاري الإنشاء...' : 'إنشاء فئات بواسطة Gemini'}
            </Button>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <h3 className="text-xl font-bold mb-4 text-indigo-300">دعوة اللاعبين</h3>
          <p className="text-sm text-slate-400 mb-2">شارك الرمز أو الرابط:</p>
          <div className="bg-gray-900 text-center p-3 rounded-lg">
            <span className="text-2xl font-mono tracking-widest text-yellow-300">{lobbyId}</span>
          </div>
          <Button onClick={handleCopyLink} className="mt-3 w-full">
            {copied ? 'تم النسخ بنجاح!' : 'نسخ رابط الدعوة'}
          </Button>
        </Card>
        <Button onClick={handleStartGame} disabled={!allPlayersReady || !categoriesSet} size="lg" className="w-full">
          { !categoriesSet ? `أكمل الفئات` : !allPlayersReady ? 'ينتظر اللاعبين...' : 'الانتقال لإعداد الأسئلة' }
        </Button>
      </div>
    </div>
  );

  const renderPlayerView = () => (
    <div className="flex justify-center">
        <Card className="text-center max-w-lg">
          <h2 className="text-3xl font-bold mb-4">أهلاً بك في اللوبي!</h2>
          <p className="mb-6 text-gray-300">قائد اللعبة يقوم بإعداد اللعبة. كن مستعدًا للانطلاق!</p>
          <Button onClick={handleReadyToggle} size="lg" variant={currentUser.isReady ? 'secondary' : 'primary'} className="w-full">
            {currentUser.isReady ? 'إلغاء الاستعداد' : 'أنا مستعد!'}
          </Button>
        </Card>
    </div>
  );

  return (
    <div className="w-full">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-indigo-400">لوبي اللعبة</h1>
      </header>
      
      <div className="mb-8">
        <Card>
            <h3 className="text-2xl font-bold mb-4 text-indigo-300">اللاعبون ({players.length}/{settings.maxPlayers})</h3>
            <ul className="space-y-3">
              {players.map(p => (
                <li key={p.id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-900/60 p-3 rounded-lg transition-all">
                  <div className="flex items-center mb-2 sm:mb-0">
                    <span className={`w-8 h-8 rounded-full mr-4 flex items-center justify-center text-xl ${p.isReady ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {p.isReady ? '✓' : '…'}
                    </span>
                     {p.id === currentUser.id && isEditingName ? (
                        <div className="flex items-center gap-2">
                            <Input 
                                value={editedName} 
                                onChange={e => setEditedName(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                                onBlur={handleNameSave}
                                autoFocus
                                className="py-1"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-lg">{p.name} {p.isGameMaster && '👑'}</span>
                            {p.id === currentUser.id && (
                                <button onClick={() => setIsEditingName(true)} title="تعديل الاسم" className="text-gray-400 hover:text-white transition-colors">
                                    ✏️
                                </button>
                            )}
                        </div>
                    )}
                  </div>
                  <div className="flex items-center justify-end">
                  {currentUser.isGameMaster && settings.useUltimates && !settings.randomizeUltimates && (
                     <select value={p.ultimate?.name || ''} onChange={e => handleAssignUltimate(p.id, e.target.value)} className="bg-gray-700 border border-gray-600 rounded-md text-white text-sm px-2 py-1 max-w-[150px] truncate">
                        <option value="">بلا قدرة</option>
                        {settings.customUltimates.filter(u => u.name.trim() !== '').map(u => <option key={u.name} value={u.name}>{u.name}</option>)}
                     </select>
                  )}
                  {currentUser.isGameMaster && !p.isGameMaster && (
                    <Button variant="danger" size="sm" onClick={() => handleKickPlayer(p.id)} className="mr-2 rtl:mr-0 rtl:ml-2">طرد</Button>
                  )}
                  </div>
                </li>
              ))}
            </ul>
        </Card>
      </div>
      
      {currentUser.isGameMaster ? renderGMView() : renderPlayerView()}
    </div>
  );
};

export default Lobby;
