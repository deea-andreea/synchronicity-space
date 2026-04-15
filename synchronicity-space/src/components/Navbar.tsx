import { NavLink } from "react-router-dom";
import './Navbar.css';

export const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="logo">synchronicity<br/>space</div>
      <div className="nav-links">
        <NavLink to="/home" className="nav-item">Home</NavLink>
        <NavLink to="/library" className="nav-item">Library</NavLink>
        <NavLink to="/store" className="nav-item">Store</NavLink>
        <NavLink to="/stats" className="nav-item">Stats</NavLink>
        <NavLink to="/user" className="nav-item">User</NavLink>
      </div>
    </nav>
  );
};