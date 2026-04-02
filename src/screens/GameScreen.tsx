import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { nakamaState } from '../nakama';

const OPCODES = {
    UPDATE_STATE: 1,
    MOVE: 2,
    GAME_OVER: 3,
    REJECT_MOVE: 4,
    REFRESH_STATE: 5
};

const Mark = {
    UNDEFINED: 0,
    X: 1,
    O: 2,
    DRAW: 3
} as const;

type MarkValue = typeof Mark[keyof typeof Mark];

const GameScreen = () => {
    const { matchId } = useParams();
    const navigate = useNavigate();
    
    const [board, setBoard] = useState<number[]>(new Array(9).fill(0));
    const [activePlayer, setActivePlayer] = useState<MarkValue>(Mark.UNDEFINED);
    const [myMark, setMyMark] = useState<MarkValue>(Mark.UNDEFINED);
    const [opponentName] = useState("Opponent");
    const [winner, setWinner] = useState<MarkValue>(Mark.UNDEFINED);
    const [reason, setReason] = useState('');
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // Refs to handle React StrictMode double-mount safely
    const winnerRef = useRef<MarkValue>(Mark.UNDEFINED);
    const matchLeftRef = useRef(false);

    // Keep winnerRef in sync with state
    useEffect(() => {
        winnerRef.current = winner;
    }, [winner]);

    // Stable function to leave the match (called explicitly, never by StrictMode cleanup)
    const doLeaveMatch = useCallback(() => {
        if (matchLeftRef.current) return; // Already left
        matchLeftRef.current = true;
        if (nakamaState.socket && matchId) {
            nakamaState.socket.leaveMatch(matchId).catch(console.error);
        }
    }, [matchId]);

    useEffect(() => {
        if (!nakamaState.socket || !nakamaState.session) {
            navigate('/');
            return;
        }

        const socket = nakamaState.socket;

        socket.onmatchdata = (result) => {
            const rawData = new TextDecoder().decode(result.data);
            console.log(`TIC-TAC-TOE: Match data [${result.op_code}]:`, rawData);
            
            try {
                const data = JSON.parse(rawData);
                switch (result.op_code) {
                    case OPCODES.UPDATE_STATE:
                        if (data.board) setBoard(data.board);
                        if (data.activePlayer !== undefined) setActivePlayer(data.activePlayer);
                        if (data.marks && nakamaState.session?.user_id) {
                            const mark = data.marks[nakamaState.session.user_id];
                            if (mark !== undefined) setMyMark(mark);
                        }
                        if (data.turnDeadline) {
                            setTimeLeft(Math.max(0, Math.floor((data.turnDeadline - Date.now()) / 1000)));
                        }
                        break;
                    case OPCODES.GAME_OVER:
                        if (data.board) setBoard(data.board);
                        setWinner(data.winner);
                        setReason(data.reason);
                        break;
                    case OPCODES.REJECT_MOVE:
                        console.warn("Move rejected:", data.error);
                        break;
                }
            } catch (e) {
                console.error("TIC-TAC-TOE: Failed to parse match data:", e, rawData);
            }
        };

        // Handshake: Request current state immediately on mount
        if (matchId) {
            socket.sendMatchState(matchId, OPCODES.REFRESH_STATE, "");
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        // Handle tab close / browser navigation
        const handleBeforeUnload = () => {
            doLeaveMatch();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            // Do NOT call leaveMatch here — StrictMode will trigger this falsely.
            // Match leaving is handled by handleLeave() and beforeunload only.
            if (nakamaState.socket) {
                nakamaState.socket.onmatchdata = () => {};
            }
            clearInterval(timer);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [matchId, navigate, doLeaveMatch]);

    const handleMove = (index: number) => {
        if (winner !== Mark.UNDEFINED) return;
        if (board[index] !== Mark.UNDEFINED) return;
        if (activePlayer !== myMark) return;

        if (nakamaState.socket && matchId) {
            nakamaState.socket.sendMatchState(matchId, OPCODES.MOVE, JSON.stringify({ position: index }));
        }
    };

    const handleLeave = () => {
        if (winnerRef.current === Mark.UNDEFINED) {
            doLeaveMatch();
        }
        navigate('/');
    };

    const renderCell = (index: number) => {
        const val = board[index];
        const isMyTurn = activePlayer === myMark && winner === Mark.UNDEFINED;
        return (
            <button 
                key={index} 
                className={`cell ${val === Mark.X ? 'mark-X' : val === Mark.O ? 'mark-O' : ''}`}
                onClick={() => handleMove(index)}
                disabled={val !== Mark.UNDEFINED || !isMyTurn || winner !== Mark.UNDEFINED}
            >
                {val === Mark.X ? 'X' : val === Mark.O ? 'O' : ''}
            </button>
        );
    };

    return (
        <div className="container">
            <div className="top-nav">
                <button className="btn" style={{background: "transparent", color: "var(--text-secondary)", padding: 0}} onClick={handleLeave}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{fontWeight: 600}}>Match vs {opponentName}</div>
                <div className="stat-box" style={{display: "flex", gap: "10px"}}>
                    <div style={{color: "var(--x-color)"}}>X</div>
                    <div style={{color: "var(--o-color)"}}>O</div>
                </div>
            </div>

            <div style={{flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%"}}>
                
                {winner === Mark.UNDEFINED ? (
                    <div className="game-status">
                        {activePlayer === Mark.UNDEFINED ? (
                            "Waiting for players..."
                        ) : activePlayer === myMark ? (
                            <span style={{color: "var(--primary-color)"}}>Your Turn</span>
                        ) : (
                            <span style={{color: "var(--text-secondary)"}}>Opponent's Turn</span>
                        )}
                    </div>
                ) : (
                    <div className="game-status" style={{fontSize: "2rem", animation: "fadeUp 0.5s ease-out"}}>
                        {winner === Mark.DRAW ? (
                            "It's a Draw!"
                        ) : winner === myMark ? (
                            <span style={{color: "var(--primary-color)"}}>Victory!</span>
                        ) : (
                            <span style={{color: "var(--accent-color)"}}>Defeat</span>
                        )}
                        <div style={{fontSize: "1rem", color: "var(--text-secondary)", marginTop: "0.5rem"}}>
                            {reason === 'timeout' ? "Win by Timeout" : reason === 'opponent_left' ? "Opponent Fled" : ""}
                        </div>
                    </div>
                )}

                <div className="game-board">
                    {board.map((_, i) => renderCell(i))}
                </div>
                
                {winner === Mark.UNDEFINED && activePlayer !== Mark.UNDEFINED && (
                    <div style={{width: "100%", maxWidth: "400px", textAlign: "center"}}>
                        <div style={{color: "var(--text-secondary)", fontSize: "0.875rem"}}>Time left: {timeLeft}s</div>
                        <div className="timer-bar">
                            <div className="timer-fill" style={{width: `${(timeLeft / 30) * 100}%`, backgroundColor: activePlayer === myMark ? "var(--primary-color)" : "var(--accent-color)"}} />
                        </div>
                    </div>
                )}

                {winner !== Mark.UNDEFINED && (
                    <button className="btn btn-primary" onClick={handleLeave} style={{marginTop: "2rem"}}>
                        Back to Menu
                    </button>
                )}

            </div>
        </div>
    );
};

export default GameScreen;
