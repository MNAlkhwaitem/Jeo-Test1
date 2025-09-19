import React, { useState, useCallback, useEffect } from 'react';
import { GameState, Player, LobbySettings, Question, BoardCell, QuestionStatus, Ultimate } from './types';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import PreGame from './pages/PreGame';
import MidGame from './pages/MidGame';
import EndGame from './pages/EndGame';
import { ULTIMATES } from './constants';

const App: React.FC = () => {
    const [gameState, setGameState] = useState<GameState>(GameState.Login);
    const [players, setPlayers] = useState<Player[]>([]);
    const [currentUser, setCurrentUser] = useState<Player | null>(null);
    const [lobbyId, setLobbyId] = useState<string>('');
    const [settings, setSettings] = useState<LobbySettings>({
        boardSize: 5,
        maxPlayers: 8,
        useUltimates: true,
        randomizeUltimates: true,
        customUltimates: ULTIMATES,
    });
    const [categories, setCategories] = useState<string[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [board, setBoard] = useState<BoardCell[][]>([]);
    const [activeUltimateAnnouncement, setActiveUltimateAnnouncement] = useState<{ player: Player; ultimate: Ultimate } | null>(null);


    useEffect(() => {
        // Synchronize currentUser with the players array to ensure data consistency
        if (currentUser) {
            const updatedUserData = players.find(p => p.id === currentUser.id);
            // Ensure we found the user and the data is actually different to prevent re-render loops
            if (updatedUserData && JSON.stringify(currentUser) !== JSON.stringify(updatedUserData)) {
                setCurrentUser(updatedUserData);
            }
        }
    }, [players, currentUser]);

    const resetToLogin = () => {
        setGameState(GameState.Login);
        setPlayers([]);
        setCurrentUser(null);
        setLobbyId('');
        setQuestions([]);
        setBoard([]);
        setCategories([]);
        setActiveUltimateAnnouncement(null);
    };

    const handleCreateLobby = (name: string) => {
        const newPlayer: Player = { id: crypto.randomUUID(), name, isGameMaster: true, isReady: true, score: 0, ultimate: null, ultimateCharge: 0, ultimateUses: 0 };
        const newLobbyId = Math.random().toString(36).substring(2, 8).toUpperCase();
        setCurrentUser(newPlayer);
        setPlayers([newPlayer]);
        setLobbyId(newLobbyId);
        setGameState(GameState.Lobby);
    };

    const handleJoinLobby = (name: string, id: string) => {
        // In a real app, you would validate the lobby ID against a server.
        // For this local version, we'll simulate a lobby always being available to join if the ID matches the created one.
        // This part is simplified. A more robust implementation would handle non-existent lobbies gracefully.
        const newPlayer: Player = { id: crypto.randomUUID(), name, isGameMaster: false, isReady: false, score: 0, ultimate: null, ultimateCharge: 0, ultimateUses: 0 };
        setCurrentUser(newPlayer);
        // This is a mock-up. In a real app, players would be fetched from the lobby state.
        setPlayers(prev => [...prev, newPlayer]);
        setLobbyId(id.toUpperCase());
        setGameState(GameState.Lobby);
    };

    const handleStartPreGame = useCallback(() => {
        // Ultimate assignment is now handled in the Lobby component before this is called.
        setGameState(GameState.PreGame);
    }, []);

    const handleStartMidGame = () => {
        const approvedQuestions = questions.filter(q => q.status === QuestionStatus.Approved);
        const newBoard: BoardCell[][] = Array(settings.boardSize).fill(0).map(() => Array(settings.boardSize).fill({ question: null, revealed: false }));

        categories.forEach((category, colIndex) => {
            const categoryQuestions = approvedQuestions
                .filter(q => q.category === category)
                .sort((a, b) => a.points - b.points);
            
            for (let rowIndex = 0; rowIndex < settings.boardSize; rowIndex++) {
                const points = (rowIndex + 1) * 100;
                const questionForCell = categoryQuestions.find(q => q.points === points);
                 if (questionForCell) {
                    newBoard[rowIndex][colIndex] = { question: questionForCell, revealed: false };
                }
            }
        });
        setBoard(newBoard);
        setGameState(GameState.MidGame);
    };

    const renderContent = () => {
        switch (gameState) {
            case GameState.Lobby:
                return <Lobby 
                    currentUser={currentUser!}
                    players={players}
                    lobbyId={lobbyId}
                    settings={settings}
                    setSettings={setSettings}
                    setPlayers={setPlayers}
                    onStartPreGame={handleStartPreGame}
                    categories={categories}
                    setCategories={setCategories}
                />;
             case GameState.PreGame:
                return <PreGame 
                    currentUser={currentUser!} 
                    questions={questions}
                    setQuestions={setQuestions}
                    categories={categories}
                    boardSize={settings.boardSize}
                    onStartMidGame={handleStartMidGame}
                    players={players}
                />;
            case GameState.MidGame:
                return <MidGame
                    currentUser={currentUser!}
                    players={players}
                    setPlayers={setPlayers}
                    board={board}
                    setBoard={setBoard}
                    onEndGame={() => setGameState(GameState.EndGame)}
                    categories={categories}
                    activeUltimateAnnouncement={activeUltimateAnnouncement}
                    setActiveUltimateAnnouncement={setActiveUltimateAnnouncement}
                 />;
            case GameState.EndGame:
                 return <EndGame 
                    players={players} 
                    questions={questions.filter(q => q.status === QuestionStatus.Approved)}
                    onQuit={resetToLogin}
                 />;
            case GameState.Login:
            default:
                return <Login onCreateLobby={handleCreateLobby} onJoinLobby={handleJoinLobby} />;
        }
    };

    return (
        <div className="min-h-screen text-slate-200 flex flex-col items-center p-4">
            <main className="w-full max-w-7xl mx-auto">
              {renderContent()}
            </main>
        </div>
    );
};

export default App;