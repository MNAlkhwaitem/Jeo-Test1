import React, { useState, useEffect } from 'react';
import { Player, BoardCell, Ultimate } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';

interface MidGameProps {
  currentUser: Player;
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  board: BoardCell[][];
  setBoard: React.Dispatch<React.SetStateAction<BoardCell[][]>>;
  onEndGame: () => void;
  categories: string[];
  activeUltimateAnnouncement: { player: Player; ultimate: Ultimate } | null;
  setActiveUltimateAnnouncement: React.Dispatch<React.SetStateAction<{ player: Player; ultimate: Ultimate } | null>>;
}

const MidGame: React.FC<MidGameProps> = ({ currentUser, players, setPlayers, board, setBoard, onEndGame, categories, activeUltimateAnnouncement, setActiveUltimateAnnouncement }) => {
  const isGM = currentUser.isGameMaster;

  // Game state
  const [activeQuestion, setActiveQuestion] = useState<BoardCell | null>(null);
  const [timer, setTimer] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // Modal states
  const [isQuestionModalOpen, setQuestionModalOpen] = useState(false);
  const [isAwardModalOpen, setAwardModalOpen] = useState(false);
  const [isEditPointsModalOpen, setEditPointsModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | null>(null);
  const [pointsChange, setPointsChange] = useState<string>('');
  const [isUltimateDetailModalOpen, setUltimateDetailModalOpen] = useState(false);
  const [playerForUltimate, setPlayerForUltimate] = useState<Player | null>(null);
  const [playerWithActiveUltimate, setPlayerWithActiveUltimate] = useState<string | null>(null);


  const [selectedCoords, setSelectedCoords] = useState<{ r: number, c: number } | null>(null);
  const [correctPlayers, setCorrectPlayers] = useState<string[]>([]);

  // Timer effect
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleCellClick = (r: number, c: number) => {
    if (isGM && !board[r][c].revealed && board[r][c].question) {
      setSelectedCoords({ r, c });
      setActiveQuestion(board[r][c]);
      setShowAnswer(false);
      setQuestionModalOpen(true);
      setTimer(60);
    }
  };
  
  const handleAwardPoints = () => {
    const question = activeQuestion?.question;
    if (!question) {
        closeAndResetModals();
        return;
    }

    const points = question.points;
    const creatorId = question.creatorId;
    
    if (correctPlayers.length === 0) {
        closeAndResetModals();
        return;
    }

    const pointRecipients = new Set([...correctPlayers, creatorId]);
    const numRecipients = pointRecipients.size;
    const pointsPerRecipient = numRecipients > 0 ? Math.floor(points / numRecipients) : 0;

    setPlayers(prev => prev.map(p => {
        let score_change = 0;
        let charge_increase = 0;
        
        if (pointRecipients.has(p.id)) {
            score_change += pointsPerRecipient;
        }

        if (correctPlayers.includes(p.id)) {
            charge_increase = 25;
        }
        
        return {
            ...p,
            score: p.score + score_change,
            ultimateCharge: Math.min(100, p.ultimateCharge + charge_increase)
        };
    }));
    closeAndResetModals();
  };

  const closeAndResetModals = () => {
      if(selectedCoords) {
        const {r, c} = selectedCoords;
        setBoard(prev => {
            const newBoard = [...prev];
            newBoard[r][c] = { ...newBoard[r][c], revealed: true };
            return newBoard;
        });
      }

      if (playerWithActiveUltimate) {
          setPlayers(prev => prev.map(p => {
              if (p.id === playerWithActiveUltimate) {
                  const { activeUltimateName, ...rest } = p;
                  return rest;
              }
              return p;
          }));
          setPlayerWithActiveUltimate(null);
      }

      setQuestionModalOpen(false);
      setAwardModalOpen(false);
      setActiveQuestion(null);
      setCorrectPlayers([]);
      setSelectedCoords(null);
      setShowAnswer(false);
      setTimer(0);
      if (board.flat().every(cell => cell.revealed || !cell.question)) {
        onEndGame();
      }
  };

  const openEditPointsModal = (player: Player) => {
    setPlayerToEdit(player);
    setEditPointsModalOpen(true);
  };

  const closeEditPointsModal = () => {
    setEditPointsModalOpen(false);
    setPlayerToEdit(null);
    setPointsChange('');
  };

  const handleScoreUpdate = (action: 'add' | 'subtract' | 'set') => {
    if (!playerToEdit || pointsChange.trim() === '') return;
    
    const amount = parseInt(pointsChange, 10);
    if (isNaN(amount)) return;

    if ((action === 'add' || action === 'subtract') && amount <= 0) return;
    if (action === 'set' && amount < 0) return;

    setPlayers(prev => prev.map(p => {
        if (p.id === playerToEdit.id) {
            const newScore = action === 'add'
                ? p.score + amount
                : action === 'subtract'
                ? Math.max(0, p.score - amount)
                : amount;
            return { ...p, score: newScore };
        }
        return p;
    }));

    closeEditPointsModal();
  };

  const openUltimateModal = (player: Player) => {
    setPlayerForUltimate(player);
    setUltimateDetailModalOpen(true);
  };

  const activateUltimate = (player: Player) => {
    if (!player.ultimate) return;
    const cost = 200 + (player.ultimateUses * 50);

    setPlayers(prev => prev.map(p => 
        p.id === player.id 
        ? { ...p, score: p.score - cost, ultimateCharge: 0, ultimateUses: p.ultimateUses + 1, activeUltimateName: player.ultimate?.name }
        : p
    ));
    
    setActiveUltimateAnnouncement({ player, ultimate: player.ultimate });
    setPlayerWithActiveUltimate(player.id);
  }

  const handleActivateUltimate = () => {
    if (!playerForUltimate || !playerForUltimate.ultimate) return;
    
    const cost = 200 + (playerForUltimate.ultimateUses * 50);

    if (playerForUltimate.score < cost) {
        alert(`${playerForUltimate.name} لا يملك نقاطًا كافية لتفعيل القدرة.`);
        setUltimateDetailModalOpen(false);
        setPlayerForUltimate(null);
        return;
    }
    
    activateUltimate(playerForUltimate);

    setUltimateDetailModalOpen(false);
    setPlayerForUltimate(null);
  };
  
  const handleUseMyUltimate = () => {
    if (!currentUser || !currentUser.ultimate) return;
    
    const cost = 200 + (currentUser.ultimateUses * 50);

    if (currentUser.score < cost) {
        alert('ليس لديك نقاط كافية لاستخدام القدرة.');
        return;
    }

    if (!currentUser.isGameMaster && currentUser.ultimateCharge < 100) {
        alert('قدرتك الخاصة ليست مشحونة بالكامل بعد.');
        return;
    }

    activateUltimate(currentUser);
  };


  return (
    <div className="w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Main Board */}
      <div className="lg:col-span-3">
        <div className={`grid gap-2`} style={{gridTemplateColumns: `repeat(${board[0]?.length || 1}, minmax(0, 1fr))`}}>
          {categories.map((cat, c) => <div key={c} className="text-center bg-indigo-900 text-white p-3 rounded-t-lg font-bold truncate shadow-lg">{cat}</div>)}
          {board.map((row, r) => 
            row.map((cell, c) => (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`aspect-[4/3] flex items-center justify-center p-2 rounded-lg transition-all duration-300 shadow-md
                  ${cell.revealed || !cell.question ? 'bg-gray-800/70' : 'bg-indigo-700 text-yellow-300'}
                  ${isGM && !cell.revealed && cell.question ? 'cursor-pointer hover:bg-indigo-600 hover:scale-105' : ''}
                  ${cell.question?.creatorId === currentUser.id && !isGM && !cell.revealed ? 'bg-yellow-600/70 text-white' : ''}`}
              >
                <span className="text-3xl font-bold" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
                   {cell.question?.creatorId === currentUser.id && !isGM && !cell.revealed && '★ '}
                   {cell.question && !cell.revealed ? cell.question.points : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-4">
        <Card>
          <h3 className="text-xl font-bold mb-3 text-indigo-300">اللاعبون</h3>
          <ul className="space-y-3">
            {players.sort((a,b) => b.score - a.score).map(p => (
              <li key={p.id} className="text-sm">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                       {p.activeUltimateName && <span className="text-purple-400">({p.activeUltimateName}) </span>}
                       {p.name} {p.id === currentUser.id ? '(أنت)' : ''}
                    </span>
                    {isGM && <Button size="sm" variant="secondary" className="px-1 py-0 text-xs" onClick={() => openEditPointsModal(p)}>تعديل</Button>}
                    {isGM && p.ultimate && p.ultimateCharge >= 100 && (
                      <Button size="sm" className="px-1 py-0 text-xs bg-purple-600 hover:bg-purple-500 focus:ring-purple-500" onClick={() => openUltimateModal(p)}>تفعيل</Button>
                    )}
                  </div>
                  <span className="font-bold text-lg text-yellow-300">{p.score}</span>
                </div>
                {p.ultimate && <div className={`w-full bg-gray-600 rounded-full h-2.5 mt-1.5 shadow-inner`}>
                  <div className="bg-gradient-to-r from-purple-600 to-violet-400 h-2.5 rounded-full transition-all duration-500" style={{width: `${p.ultimateCharge}%`}}></div>
                </div>}
              </li>
            ))}
          </ul>
        </Card>

        {(currentUser.ultimate || isGM) && (
            <Card>
                <h3 className="text-xl font-bold mb-3 text-indigo-300">قدرتي الخاصة</h3>
                {currentUser.ultimate ? (
                    (() => {
                        const cost = 200 + (currentUser.ultimateUses * 50);
                        const canUse = (currentUser.isGameMaster || currentUser.ultimateCharge >= 100) && currentUser.score >= cost;
                        return (
                            <>
                              <div>
                                  <p className="font-bold text-purple-400">{currentUser.ultimate.name}</p>
                                  <p className="text-sm text-gray-300 truncate">{currentUser.ultimate.description}</p>
                              </div>
                              <div className="flex gap-2 mt-3">
                                  <Button size="sm" variant="secondary" onClick={() => openUltimateModal(currentUser)} className="w-full">
                                      التفاصيل
                                  </Button>
                                  <Button size="sm" onClick={handleUseMyUltimate} disabled={!canUse} className="w-full">
                                      استخدام
                                  </Button>
                              </div>
                            </>
                        );
                    })()
                ) : (
                  <p className="text-sm text-gray-400">لا توجد قدرات خاصة في هذه اللعبة.</p>
                )}
            </Card>
        )}
        
        <Button variant='danger' onClick={onEndGame} className="w-full">إنهاء اللعبة</Button>
      </div>

      {/* Modals */}
      <Modal isOpen={isQuestionModalOpen} onClose={()=>{}} title={activeQuestion?.question?.category || ''}>
          <div className="text-center space-y-4 min-h-[200px] flex flex-col justify-center">
              <div className="text-7xl font-bold text-yellow-300 my-4" style={{textShadow: '3px 3px 5px rgba(0,0,0,0.7)'}}>{timer}</div>
              <p className="text-3xl font-semibold">{activeQuestion?.question?.question}</p>
              {showAnswer && <div className="animate-fade-in"><p className="text-3xl font-bold text-green-400 bg-gray-800 p-4 rounded-lg">الجواب: {activeQuestion?.question?.answer}</p></div>}
              
              {isGM && (
                  <div className="pt-4 flex justify-center gap-4">
                      {!showAnswer ? (
                          <Button onClick={() => setShowAnswer(true)}>إظهار الجواب</Button>
                      ) : (
                          <Button onClick={() => { setQuestionModalOpen(false); setAwardModalOpen(true); }}>توزيع النقاط</Button>
                      )}
                  </div>
              )}
          </div>
      </Modal>

      {isGM && <Modal isOpen={isAwardModalOpen} onClose={closeAndResetModals} title="توزيع النقاط">
          <div className="space-y-3">
              <p className="mb-4 text-center">اختر اللاعبين الذين أجابوا بشكل صحيح:</p>
              {players.map(p => (
                  <label key={p.id} htmlFor={`player_${p.id}`} className="flex items-center bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors">
                      <input type="checkbox" id={`player_${p.id}`} checked={correctPlayers.includes(p.id)} onChange={e => {
                          if (e.target.checked) setCorrectPlayers(prev => [...prev, p.id]);
                          else setCorrectPlayers(prev => prev.filter(id => id !== p.id));
                      }} className="w-6 h-6 ml-4" />
                      <span className="flex-1 text-lg">{p.name} {p.isGameMaster && '👑'}</span>
                  </label>
              ))}
              <div className="flex gap-2 mt-6">
                <Button onClick={closeAndResetModals} variant="secondary" className="w-full">تخطّي</Button>
                <Button onClick={handleAwardPoints} className="w-full">تأكيد</Button>
              </div>
          </div>
      </Modal>}

      <Modal isOpen={isEditPointsModalOpen} onClose={closeEditPointsModal} title={`تعديل نقاط ${playerToEdit?.name}`}>
          {playerToEdit && (
              <div className="space-y-4">
                  <p className="text-center text-lg">النقاط الحالية: <span className="font-bold text-yellow-300">{playerToEdit.score}</span></p>
                  <Input
                      type="number"
                      value={pointsChange}
                      onChange={(e) => setPointsChange(e.target.value)}
                      placeholder="أدخل القيمة"
                      min="0"
                      className="text-center"
                  />
                  <div className="grid grid-cols-3 gap-2 pt-2">
                      <Button onClick={() => handleScoreUpdate('add')} disabled={!pointsChange}>إضافة</Button>
                      <Button variant="danger" onClick={() => handleScoreUpdate('subtract')} disabled={!pointsChange}>خصم</Button>
                      <Button variant="secondary" onClick={() => handleScoreUpdate('set')} disabled={pointsChange === ''}>تعيين</Button>
                  </div>
              </div>
          )}
      </Modal>

      <Modal isOpen={isUltimateDetailModalOpen} onClose={() => { setUltimateDetailModalOpen(false); setPlayerForUltimate(null); }} title={`تفاصيل القدرة الخاصة`}>
        {playerForUltimate && playerForUltimate.ultimate && (
            (() => {
                const cost = 200 + (playerForUltimate.ultimateUses * 50);
                return (
                    <div className="space-y-4 text-center">
                        <h3 className="text-2xl font-bold text-purple-400">{playerForUltimate.ultimate.name}</h3>
                        <p className="text-lg text-slate-300">{playerForUltimate.ultimate.description}</p>
                        <div className="bg-gray-800 p-3 rounded-lg">
                            <p className="text-slate-400">التكلفة للاستخدام التالي:</p>
                            <p className="text-2xl font-bold text-yellow-300">{cost} نقطة</p>
                            <p className="text-sm text-slate-400 mt-1">النقاط بعد الاستخدام: {playerForUltimate.score - cost}</p>
                        </div>
                        
                        {isGM && playerForUltimate.id !== currentUser.id && (
                            <div className="pt-4 flex justify-end gap-3">
                                <Button onClick={() => { setUltimateDetailModalOpen(false); setPlayerForUltimate(null); }} variant="secondary">إلغاء</Button>
                                <Button onClick={handleActivateUltimate}>تأكيد التفعيل</Button>
                            </div>
                        )}
                        
                        {playerForUltimate.id === currentUser.id && (
                             <div className="pt-4">
                                 <Button onClick={() => { setUltimateDetailModalOpen(false); setPlayerForUltimate(null); }} className="w-full" variant="secondary">إغلاق</Button>
                             </div>
                         )}
                    </div>
                );
            })()
        )}
      </Modal>
      
      {/* Ultimate Activation Announcement */}
      {activeUltimateAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 transition-opacity duration-300 animate-fade-in" onClick={() => setActiveUltimateAnnouncement(null)}>
            <style>{`
              @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            `}</style>
            <Card className="max-w-md w-full border-2 border-purple-500 shadow-purple-500/50" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-center text-2xl font-bold text-yellow-300 mb-2">
                {activeUltimateAnnouncement.player.name}
              </h2>
              <p className="text-center text-slate-300 mb-4">
                قام بتفعيل قدرة خاصة!
              </p>
              <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                <h3 className="text-xl font-bold text-purple-400">{activeUltimateAnnouncement.ultimate.name}</h3>
                <p className="mt-2">{activeUltimateAnnouncement.ultimate.description}</p>
              </div>
              <Button onClick={() => setActiveUltimateAnnouncement(null)} className="w-full mt-6">
                إغلاق
              </Button>
            </Card>
          </div>
        )}

    </div>
  );
};

export default MidGame;
