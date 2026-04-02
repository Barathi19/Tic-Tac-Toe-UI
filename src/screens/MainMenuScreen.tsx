import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LogOut, Trophy } from 'lucide-react';
import { nakamaClient, nakamaState } from '../nakama';

const MainMenuScreen = () => {
    const navigate = useNavigate();
    const [searching, setSearching] = useState(false);
    const [matchmakerTicket, setMatchmakerTicket] = useState('');
    const [leaderboard, setLeaderboard] = useState<any[]>([]);

    useEffect(() => {

        const setupSocket = async () => {
            try {
                const socket = await nakamaState.connectSocket();

                socket.onmatchmakermatched = (matched) => {
                    console.log("Matched!", matched);
                    // Join the match using the token
                    socket.joinMatch(matched.match_id, matched.token).then(match => {
                        navigate(`/game/${match.match_id}`);
                    });
                };
            } catch (e) {
                console.error("Socket error", e);
            }
        };

        const fetchLeaderboard = async () => {
            if (nakamaState.session) {
                try {
                    const result = await nakamaClient.listLeaderboardRecords(nakamaState.session, "tictactoe_wins", undefined, undefined);
                    setLeaderboard(result.records || []);
                } catch (e) {
                    console.error("Leaderboard error", e);
                }
            }
        };

        setupSocket();
        fetchLeaderboard();

        return () => {
            if (nakamaState.socket) {
                nakamaState.socket.onmatchmakermatched = () => {};
            }
        };
    }, [navigate]);

    const handleSearch = async () => {
        if (!nakamaState.socket) return;

        try {
            if (searching && matchmakerTicket) {
                await nakamaState.socket.removeMatchmaker(matchmakerTicket);
                setSearching(false);
                setMatchmakerTicket('');
            } else {
                setSearching(true);
                const query = "*";
                const minCount = 2;
                const maxCount = 2;
                const ticket = await nakamaState.socket.addMatchmaker(query, minCount, maxCount);
                setMatchmakerTicket(ticket.ticket);
            }
        } catch (e) {
            console.error("Matchmaker error", e);
            setSearching(false);
        }
    };

    const handleLogout = () => {
        nakamaState.logout();
        navigate('/login');
    };

    return (
        <div className="container">
            <div className="top-nav">
                <div>
                    <h2 style={{ margin: 0 }}>HQ</h2>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{nakamaState.session?.username}</div>
                </div>
                <button className="btn" style={{ background: "transparent", color: "var(--text-secondary)" }} onClick={handleLogout}>
                    <LogOut size={20} /> Logout
                </button>
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", gap: "2rem" }}>

                <div className="card" style={{ maxWidth: "500px", textAlign: "center" }}>
                    <h2>Ready for Battle?</h2>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>Find an opponent and show your tactical skills.</p>
                    <button
                        className={`btn ${searching ? 'btn-accent' : 'btn-primary'}`}
                        onClick={handleSearch}
                        style={{ width: "100%", padding: "1.25rem", fontSize: "1.25rem" }}
                    >
                        {searching ? (
                            <><div className="loader" style={{ borderColor: "rgba(255,255,255,0.2)", borderTopColor: "white" }} /> Cancel Search</>
                        ) : (
                            <><Search size={24} /> Find Match</>
                        )}
                    </button>
                </div>

                <div className="card" style={{ maxWidth: "500px", padding: "1.5rem" }}>
                    <h3 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}><Trophy color="var(--primary-color)" /> Top Players</h3>

                    {leaderboard.length === 0 ? (
                        <div style={{ color: "var(--text-secondary)", textAlign: "center", padding: "1rem 0" }}>No records yet. Be the first!</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            {leaderboard.map((record, idx) => (
                                <div key={record.owner_id} style={{ display: "flex", justifyContent: "space-between", background: "rgba(0,0,0,0.2)", padding: "0.75rem", borderRadius: "var(--border-radius-sm)" }}>
                                    <div style={{ display: "flex", gap: "1rem" }}>
                                        <span style={{ color: idx === 0 ? "var(--primary-color)" : "var(--text-secondary)", fontWeight: "bold" }}>{idx + 1}.</span>
                                        <span>{record.username}</span>
                                    </div>
                                    <span style={{ fontWeight: "bold" }}>{record.score} Win{record.score !== "1" ? "s" : ""}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default MainMenuScreen;
