import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

const Layout = () => {
  return (
    <div className="app-container">
      <Navbar /> 
      <main>
        <Outlet /> 
      </main>
    </div>
  );
};

export default Layout;