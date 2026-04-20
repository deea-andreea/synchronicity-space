import { useEffect, useMemo, useState } from "react";
import { getLastWeekStats, getTopGenres } from "../utils/stats";
import './StatsPage.css'
import { getCookie } from "../utils/cookies";

export default function StatsPage() {
    const [setTopGenres] = useState<any[]>([]);
    const [setWeekStats] = useState<any[]>([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [history, setHistory] = useState<any[]>([]);

    const topGenres = useMemo(() => getTopGenres(history), [history]);
    const weekStats = useMemo(() => getLastWeekStats(history), [history]);

    const [view, setView] = useState<"genres-tab" | "genres-viz" | "weekly-tab" | "weekly-viz">("genres-tab");
    const maxGenreCount = Math.max(...topGenres.map(g => g.count), 1);
    const maxAlbums = Math.max(...weekStats.map(g => g.albums), 1);

    const GENRES = ["Rock", "Pop", "Blues", "Jazz"];

    useEffect(() => {
        const data = getCookie("listening_history");

        if (data) {
            try {
                setHistory(JSON.parse(data));
            } catch {
                setHistory([]);
            }
        }
    }, []);

    const simulationOneStep = () => {
        const now = new Date();
        const len = Math.random() * 5

        const newEntries = Array.from({ length: len }).map((_, i) => ({
            id: `sim-${Date.now()}-${i}`,
            genre: GENRES[Math.floor(Math.random() * GENRES.length)],
            date: new Date(
                now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ),
        }));
        setHistory(prev => [...prev, ...newEntries]);
    };
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const startSimulation = async () => {
        for (let i = 0; i < 40; i++) {
            getTopGenres([]);
            simulationOneStep();
            await delay(500);
        }
    };

    const handleSimulationClick = () => {
        startSimulation();
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="library-container">
            <img className="library-text" src="/stats-text.svg" />
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
                                                                backgroundColor: i === 0 ? '#d7b653c6' : i === 1 ? '#70d9ffa7' : i === 2 ? '#5b9752b6' : i===3 ? '#8d62c6aa': '#ffffffa8'
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
                                                        style={{ height: `${(item.notes / maxAlbums) * 100}%`, 
                                                            backgroundColor:'transparent'}}
                                                    >
                                                        <div className="vector-overlay"
                                                        style={{
                                                            backgroundColor: '#f0e68cc1'
                                                        }}></div>
                                                    </div>
                                                    <div
                                                        className="vector-bar albums-bar"
                                                        style={{ height: `${(item.albums / maxAlbums) * 100}%`,
                                                    backgroundColor:'transparent' }}
                                                    >
                                                        <div className="vector-overlay"
                                                        style={{
                                                            backgroundColor:'#a288f0c2'
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
                </div>
            </div>
        </div >
    )
}