import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { useState } from "react";
import { register } from "../api/authApi";

export default function RegisterPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        confirmPassword: ""
    });
    const [error, setError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        try {
            await register({ username: formData.username, email: formData.email, password: formData.password });
            setIsSubmitted(true);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (isSubmitted) {
        return (
            <div className="landing-wrapper">
                <main className="landing-content">
                    <div className="vinyl-section">
                        <div className="vinyl-wrapper">
                            <img src="/logo-vinyl.svg" alt="Vinyl" className="spinning-vinyl" />
                        </div>
                    </div>
                    <div className="login-section">
                        <h1 className="welcome-text">Verify Your Identity</h1>
                        <p style={{ color: "#ccc", lineHeight: "1.6", marginBottom: "20px" }}>
                            An email verification link has been sent to <strong>{formData.email}</strong>.
                        </p>
                        <p style={{ color: "#aaa", fontSize: "0.9rem", marginBottom: "30px" }}>
                            Please check your inbox and follow the link to activate your account.
                        </p>
                        <button onClick={() => navigate("/login")} className="login-btn">
                            Go to Login
                        </button>
                    </div>
                </main>
            </div>
        );
    }

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
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                            />
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
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