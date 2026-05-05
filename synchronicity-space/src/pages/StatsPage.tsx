import { useEffect, useMemo, useState } from "react";
// import { getLastWeekStats, getTopGenres } from "../utils/stats";
import { fetchStatsSummary, recordListen } from "../api/statsApi";
import './StatsPage.css'
import { useNoteSocket } from "../hooks/useNoteSocket";
// import { getCookie } from "../utils/cookies";

export default function StatsPage({currentUser}: {currentUser: any}) {
    const [topGenres, setTopGenres] = useState<any[]>([]);
    const [weekStats, setWeekStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUserId = "1";
    const [view, setView] = useState<"genres-tab" | "genres-viz" | "weekly-tab" | "weekly-viz">("genres-tab");
    console.log(currentUser)
    const maxGenreCount = Math.max(...topGenres.map(g => g.count), 1);
    const max = Math.max(
        ...weekStats.map(s => s.albums),
        ...weekStats.map(s => s.notes),
        1
    );

    const GENRES = ["Rock", "Pop", "Blues", "Jazz"];

    useEffect(() => {
        setLoading(true);
        fetchStatsSummary(currentUser.id) 
            .then(data => {
                setTopGenres(data.topGenres || []);
                setWeekStats(data.weekStats || []);
            })
            .catch(err => console.error("Stats Error:", err))
            .finally(() => setLoading(false));
    }, [currentUser.id]);

    const handleSimulationClick = async () => {
        // Generate fake listening events on the backend
        const albums = [
            { id: "1ATL5uqDgopeOnvYm2o0Q3", genre: "Rock" },
            { id: "2", genre: "Pop" },
            { id: "3", genre: "Grunge" },
            { id: "4", genre: "Blues" },
        ];

        // POST several listen events spread across the last week
        const promises = Array.from({ length: 20 }, (_, i) => {
            const album = albums[i % albums.length];
            return recordListen(currentUserId, album.id, album.genre);
        });

        await Promise.all(promises);

        // Re-fetch stats after simulation
        const data = await fetchStatsSummary(currentUserId);
        setTopGenres(data.topGenres);
        setWeekStats(data.weekStats);
    };

    const [simulating, setSimulating] = useState(false);

    const runSimulation = async () => {
        setSimulating(true);
        await fetch("http://localhost:3000/generator/start", { method: "POST" });
        setTimeout(async () => {
            await fetch("http://localhost:3000/generator/stop", { method: "POST" });
            setSimulating(false);
        }, 10000);
    };

    useNoteSocket(() => {
        fetchStatsSummary(currentUserId)
            .then(data => {
                // setTopGenres(data.topGenres);
                setWeekStats(data.weekStats);
                console.log(data)
            })
            .catch(() => { });

    });

    return (
        <div className="library-container">
            <div className="title-text">Your Stats</div>
            <div className="stats-container">
                <div className="camera-wrapper">
                    <img src="/camera.svg" className="camera-body" alt="Canon Camera" />
                    <div className="camera-screen">
                        {view === "genres-tab" && (
                            <div className="screen">
                                <div className="screen-content">
                                    <div className="screen-header">
                                        <span>genre</span>
                                        <span>albums</span>
                                    </div>
                                    <ul className="stats-list">
                                        {topGenres.map((item, i) => (
                                            <li key={i}>
                                                <span className="genre-name">{item.genre}</span>
                                                <span className="genre-count">{item.count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="screen-footer">★ favourite genres ★</div>
                            </div>
                        )}
                        {view === "genres-viz" && (
                            <div className="screen-content">
                                <div className="screen-content viz-layout">
                                    <div className="bar-chart-svg-container">
                                        <div className="bar-chart-container">
                                            {topGenres.map((item, i) => (
                                                <div key={i} className="bar-column">
                                                    <div
                                                        className="vector-bar"
                                                        style={{
                                                            height: `${(item.count / maxGenreCount) * 100}%`,
                                                            backgroundColor: "transparent"
                                                        }}
                                                    >
                                                        <div className="vector-overlay"
                                                            style={{
                                                                // height: `${(item.count / maxGenreCount) * 100}%`,
                                                                backgroundColor: i === 0 ? '#d7b653c6' : i === 1 ? '#70d9ffa7' : i === 2 ? '#5b9752b6' : i === 3 ? '#8d62c6aa' : '#ffffffa8'
                                                            }}></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <ul className="viz-legend">
                                            {topGenres.map((item, i) => (
                                                <li key={i} className={`legend-item-color-${i}`}>
                                                    <span className="star">★</span> {item.genre}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}
                        {view === "weekly-tab" && (
                            < div className="screen-content">
                                <div className="screen-header">
                                    <span>day</span>
                                    <span>albums</span>
                                    <span>notes</span>
                                </div>
                                <ul className="stats-list">
                                    {weekStats.map((item, i) => (
                                        <li key={i}>
                                            <span className="weekday-field">{item.weekday}</span>
                                            <span className="notes-count">{item.albums}</span>
                                            <span className="notes-count">{item.notes.toFixed(0)}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="screen-footer">⏱ weekly activity ⏱</div>
                            </div>
                        )}
                        {view === "weekly-viz" && (
                            <div className="screen-content">
                                <div className="viz-legend-top">
                                    <div className="legend-item purple">
                                        <span className="star">★</span> albums listened to
                                    </div>
                                    <div className="legend-item yellow">
                                        <span className="star">★</span> notes left
                                    </div>
                                </div>

                                <div className="bar-chart-container-weekly">
                                    {weekStats.map((item, i) => {

                                        return (
                                            <div key={i} className="day-column">
                                                <div className="bars-group">
                                                    <div
                                                        className="vector-bar"
                                                        style={{
                                                            height: `${(item.notes / max) * 100}%`,
                                                            backgroundColor: 'transparent'
                                                        }}
                                                    >
                                                        <div className="vector-overlay"
                                                            style={{
                                                                backgroundColor: '#f0e68cc1'
                                                            }}></div>
                                                    </div>
                                                    <div
                                                        className="vector-bar albums-bar"
                                                        style={{
                                                            height: `${(item.albums / max) * 100}%`,
                                                            backgroundColor: 'transparent'
                                                        }}
                                                    >
                                                        <div className="vector-overlay"
                                                            style={{
                                                                backgroundColor: '#a288f0c2'
                                                            }}></div>
                                                    </div>
                                                </div>
                                                <span className="day-label">{item.weekday.toLowerCase()}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="screen-footer">★ favourite genres ★</div>

                            </div>
                        )}
                    </div>

                    <button
                        className="btn-overlay btn-up"
                        onClick={() => setView("genres-tab")}
                        title="View Genres"
                    />
                    <button
                        className="btn-overlay btn-right"
                        onClick={() => {
                            if (view === "genres-tab") {
                                setView("genres-viz");
                            } else if (view === "weekly-tab") {
                                setView("weekly-viz");
                            }
                        }}
                        title="View Weekly"
                    />

                    <button
                        className="btn-overlay btn-down"
                        onClick={() => setView("weekly-tab")}
                        title="View Weekly"
                    />


                </div>

                <div className="stats-info">
                    <h2>snapshot of your listening history</h2>
                    <p>press buttons to interact</p>
                    <button onClick={handleSimulationClick}>
                        Start Simulation
                    </button>
                    <button
                        onClick={runSimulation}
                        disabled={simulating}
                    >
                        {simulating ? "Simulating..." : " Simulate activity"}
                    </button>
                    {simulating && <p style={{ fontSize: "0.8vw", color: "#c4ac86" }}>Generating live data...</p>}
                </div>
            </div>
        </div >
    )
}