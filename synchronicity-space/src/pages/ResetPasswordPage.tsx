import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../api/authApi";
import "./LoginPage.css";

export default function ResetPasswordPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [statusMessage, setStatusMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setStatusMessage("");

        if (!token) {
            setErrorMessage("Security Error: Management token is missing from the link parameters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage("Validation Error: Inputted passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword({ token, newPassword });
            setStatusMessage("Password changed successfully! Redirecting you to login...");
            
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err: any) {
            setErrorMessage(err.message || "Token signature is invalid, corrupted, or expired.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="landing-wrapper">
            <main className="landing-content">
                <div className="login-section" style={{ maxWidth: "450px", margin: "0 auto" }}>
                    <h1 className="welcome-text" style={{ fontSize: "2rem", marginBottom: "10px" }}>Reset Password</h1>
                    <p style={{ color: "#aaa", marginBottom: "20px", fontSize: "0.95rem" }}>
                        Please type your new authorization password below to safely overwrite your credentials.
                    </p>

                    <form className="login-form" onSubmit={handleSubmit}>
                        {errorMessage && <div className="auth-error-banner" style={{ color: "red", marginBottom: "15px" }}>{errorMessage}</div>}
                        {statusMessage && <div className="auth-success-banner" style={{ color: "#4caf50", marginBottom: "15px" }}>{statusMessage}</div>}

                        <div className="input-group">
                            <input 
                                type="password" 
                                placeholder="New Password" 
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)} 
                                required 
                                disabled={isLoading || !!statusMessage}
                            />
                        </div>

                        <div className="input-group">
                            <input 
                                type="password" 
                                placeholder="Confirm New Password" 
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)} 
                                required 
                                disabled={isLoading || !!statusMessage}
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={isLoading || !!statusMessage}>
                            {isLoading ? "Updating Credentials..." : "Update Password"}
                        </button>
                    </form>

                    {!statusMessage && (
                        <div style={{ marginTop: "20px", textAlign: "center" }}>
                            <Link to="/login" style={{ color: "#1db954", textDecoration: "none", fontSize: "0.9rem" }}>
                                Cancel and Return
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}