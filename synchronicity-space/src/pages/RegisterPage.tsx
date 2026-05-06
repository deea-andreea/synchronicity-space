import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { useState } from "react";
import {register} from "../api/authApi"

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register({ username:formData.username, password:formData.password });
            navigate("/login");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="landing-wrapper">
            <main className="landing-content">
                <div className="vinyl-section">
                    <div className="vinyl-wrapper">
                        <img src="/logo-vinyl.svg" alt="Vinyl" className="spinning-vinyl" />
                    </div>
                </div>
                <div className="login-section">
                    <h1 className="welcome-text">Join the Space</h1>

                    <form className="login-form" onSubmit={handleRegister}>
                        {error && <div className="auth-error-banner">{error}</div>}

                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Username"
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Password"
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                        </div>

                        <button type="submit" className="login-btn">Sign Up</button>
                    </form>
                </div>
            </main>
        </div>
    );
}