import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your security credentials...");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid verification request: Missing secure token context.");
      return;
    }

    const confirmIdentity = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Identity confirmation failed.");
        }

        setStatus("success");
        setMessage(data.message || "Identity confirmed over encrypted handshake!");
      } catch (err: any) {
        setStatus("error");
        setMessage(err.message || "Failed to close the verification loop.");
      }
    };

    confirmIdentity();
  }, [searchParams]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "#121212", color: "#fff", fontFamily: "sans-serif", padding: "20px"
    }}>
      <div style={{
        background: "#1e1e1e", padding: "40px", borderRadius: "8px", textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.5)", maxWidth: "400px"
      }}>
        {status === "loading" && <h3 style={{ color: "#aaa" }}>Closing 3-Way Handshake...</h3>}
        {status === "success" && <h3 style={{ color: "#1db954" }}>Identity Verified</h3>}
        {status === "error" && <h3 style={{ color: "#e91429" }}>Verification Blocked</h3>}

        <p style={{ margin: "20px 0", color: "#ccc", lineHeight: "1.5" }}>{message}</p>

        {status !== "loading" && (
          <button
            onClick={() => navigate("/login")}
            style={{
              backgroundColor: "#1db954", color: "#fff", border: "none", padding: "12px 24px",
              fontWeight: "bold", borderRadius: "4px", cursor: "pointer", transition: "0.2s"
            }}
          >
            Return to Login
          </button>
        )}
      </div>
    </div>
  );
}