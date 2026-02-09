import "./TopBar.css";
import melcalLogo from "../../assets/melcal-logo.png";

export default function TopBar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <img
          src={melcalLogo}
          alt="Melcal logo"
          className="topbar-logo"
        />
        <span className="topbar-title">RFQ Document Analysis</span>
      </div>
    </header>
  );
}
