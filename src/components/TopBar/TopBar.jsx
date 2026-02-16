import "./TopBar.css";
import melcalLogo from "../../assets/melcal-logo.png";
import { useAuth } from "../../auth/useAuth";

export default function TopBar() {
  const { logout } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <img src={melcalLogo} alt="Melcal logo" className="topbar-logo" />
        <span className="topbar-title">RFQ Document Analysis</span>
      </div>

      <div className="topbar-right">
        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </header>
  );
}
