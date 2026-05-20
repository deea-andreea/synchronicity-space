import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authApi";
import "./LoginPage.css"; 

export default function ForgotPasswordPage() {
    const [username, setUsername] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setStatusMessage("");
        setIsLoading(true);

        try {
            const res = await forgotPassword(username);
            
            setStatusMessage("Email sent!");
        } catch (err: any) {
            setErrorMessage(err.message || "Could not find a user account associated with that username.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="landing-wrapper">
            <main className="landing-content">
                <div className="login-section" style={{ maxWidth: "450px", margin: "0 auto" }}>
                    <h1 className="welcome-text" style={{ fontSize: "2rem", marginBottom: "10px" }}>Account Recovery</h1>
                    <p style={{ color: "#aaa", marginBottom: "20px", fontSize: "0.95rem" }}>
                        Enter your email below.
                    </p>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {errorMessage && <div className="auth-error-banner" style={{ color: "red", marginBottom: "15px" }}>{errorMessage}</div>}
                        {statusMessage && <div className="auth-success-banner" style={{ color: "#4caf50", marginBottom: "15px", lineHeight: "1.4" }}>{statusMessage}</div>}

                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Enter your email" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)} 
                                required 
                                disabled={isLoading}
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={isLoading}>
                            {isLoading ? "Generating Link..." : "Send Recovery Link"}
                        </button>
                    </form>

                    <div style={{ marginTop: "20px", textAlign: "center" }}>
                        <Link to="/login" style={{ color: "#1db954", textDecoration: "none", fontSize: "0.9rem" }}>
                            ← Back to Login
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}