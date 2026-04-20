import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { mockUsers } from "../data/mockUsers";
import { useState } from "react";

export default function PresentationPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ identifier: "", password: "" });
    const [loginError, setLoginError] = useState("");

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError(""); 
        const user = mockUsers.find(
            (u) =>
                (u.email === formData.identifier || u.name === formData.identifier) &&
                u.password === formData.password 
        );

        if (user) {
            document.cookie = `active_user_id=${user.id}; path=/; max-age=3600`;
            document.cookie = `is_logged_in=true; path=/`;

            navigate("/library");
        } else {
            setLoginError("Invalid username or password.");
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

                    <form className="login-form"
                        onSubmit={handleLogin}
                    >
                        {loginError && <div className="auth-error-banner">{loginError}</div>}
                        <div className="input-group">
                            <input type="text" placeholder="Username or e-mail address" onChange={(e) => setFormData({...formData, identifier: e.target.value})} required/>
                        </div>
                        <div className="input-group">
                            <input type="password" placeholder="Password" onChange={(e) => setFormData({...formData, password: e.target.value})} required/>
                            <Link to="/forgot" className="forgot-link">Forgot password?</Link>
                        </div>

                        <button type="submit" className="login-btn">Log In</button>
                    </form>
                </div>


            </main>
        </div>
    );
}