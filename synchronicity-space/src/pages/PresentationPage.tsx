import { Link } from "react-router-dom";
import "./PresentationPage.css";

export default function PresentationPage() {
  return (
    <div className="landing-wrapper">

      <main className="landing-content">
        <div className="vinyl-section">
          <div className="vinyl-wrapper">
            <img src="/logo-vinyl.svg" alt="Vinyl" className="spinning-vinyl" />
          </div>
        </div>

        <div className="text-section">
          <div className="headline">
            <h2>Experience music</h2>
            <h2 className="italic">the way it was meant</h2>
            <h2 className="italic">to be listened to.</h2>
          </div>

          <p className="description">
            Discover, collect and listen to albums.<br />
            Connect with other music lovers.
          </p>

          <div className="cta-buttons">
            <Link to="/store" className="btn btn-red">Sign Up</Link>
            <Link to="/store" className="btn btn-outline">Log In</Link>
          </div>
        </div>
      </main>
    </div>
  );
}