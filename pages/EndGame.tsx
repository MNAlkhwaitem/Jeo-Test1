import React, { useEffect } from 'react';
import { Player, Question } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';

interface EndGameProps {
  players: Player[];
  questions: Question[];
  onQuit: () => void;
}

const Confetti: React.FC = () => {
    useEffect(() => {
        const confettiContainer = document.getElementById('confetti-container');
        if (!confettiContainer) return;
        
        for (let i = 0; i < 100; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti-piece';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.animationDelay = `${Math.random() * 5}s`;
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
            confettiContainer.appendChild(confetti);
        }
    }, []);

    return (
        <div id="confetti-container" className="absolute inset-0 overflow-hidden pointer-events-none">
            <style>{`
                .confetti-piece {
                    position: absolute;
                    width: 10px;
                    height: 20px;
                    opacity: 0;
                    top: -20px;
                    animation: fall 5s linear infinite;
                }
                @keyframes fall {
                    0% {
                        transform: translateY(-20px) rotateZ(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100vh) rotateZ(720deg);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
};


const EndGame: React.FC<EndGameProps> = ({ players, questions, onQuit }) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  const exportQuestions = (format: 'json' | 'txt') => {
    let content = '';
    const filename = `jeopardy_questions_${new Date().toISOString().slice(0,10)}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(questions, null, 2);
    } else {
      content = questions.map(q => `الفئة: ${q.category}\nالنقاط: ${q.points}\nالسؤال: ${q.question}\nالجواب: ${q.answer}\n\n---\n\n`).join('');
    }

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const getPodiumClass = (index: number) => {
      switch(index) {
          case 0: return 'bg-yellow-500/30 border-2 border-yellow-400 scale-105';
          case 1: return 'bg-gray-400/30 border-2 border-gray-300';
          case 2: return 'bg-orange-600/30 border-2 border-orange-500';
          default: return 'bg-gray-700/50';
      }
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen">
      {winner && <Confetti />}
      <Card className="w-full max-w-3xl text-center z-10">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 mb-4">
          انتهت اللعبة!
        </h1>
        {winner && <h2 className="text-4xl text-yellow-300 mb-8">الفائز هو {winner.name}!</h2>}
        
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-4 text-indigo-300">النتائج النهائية</h3>
          <ul className="space-y-2">
            {sortedPlayers.map((p, index) => (
              <li 
                key={p.id} 
                className={`flex justify-between items-center p-4 rounded-lg text-xl transition-all duration-300 ${getPodiumClass(index)}`}
              >
                <div className="font-bold flex items-center">
                    <span className="w-8 text-left">{index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}</span>
                    <span>{p.name}</span>
                </div>
                <span className="font-mono">{p.score} نقطة</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            <Button onClick={() => exportQuestions('json')}>
                <span className="mr-2">💾</span> تصدير (JSON)
            </Button>
            <Button onClick={() => exportQuestions('txt')}>
                <span className="mr-2">📄</span> تصدير (TXT)
            </Button>
          </div>
          <Button variant="danger" onClick={onQuit} className="w-full" size="lg">
            الخروج والعودة إلى البداية
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EndGame;
