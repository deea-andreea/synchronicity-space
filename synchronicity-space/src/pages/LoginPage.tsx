import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { mockUsers } from "../data/mockUsers";
import { useState } from "react";
import { login } from "../api/authApi";

export default function LoginPage({setCurrentUser}: {setCurrentUser: React.Dispatch<React.SetStateAction<any>>}) {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ identifier: "", password: "" });
    const [loginError, setLoginError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError("");
        try {
            const response = await login({ username: formData.identifier, password: formData.password });
            
            localStorage.setItem("authToken", response.token); 
            
            document.cookie = `active_user_id=${response.id}; path=/; max-age=3600; secure; samesite=strict`;
            document.cookie = `is_logged_in=true; path=/; secure; samesite=strict`;

            setCurrentUser(response);

            navigate("/home");
        } catch (err: any) {
            console.error("Authentication submission failed:", err);
            setLoginError(err.response?.data?.error || "Invalid username or password. Please try again.");
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
                    <h1 className="welcome-text">Welcome Back!</h1>

                    <form className="login-form" onSubmit={handleLogin}>
                        {loginError && <div className="auth-error-banner" style={{color: 'red', marginBottom: '15px'}}>{loginError}</div>}
                        
                        <div className="input-group">
                            <input 
                                type="text" 
                                placeholder="Username or e-mail address" 
                                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })} 
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
                            <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                        </div>

                        <button type="submit" className="login-btn">Log In</button>
                    </form>
                </div>
            </main>
        </div>
    );
}