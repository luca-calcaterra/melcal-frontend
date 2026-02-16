import { AuthProvider } from "./auth/AuthContext";
import Upload from "./components/Upload/Upload";
import Download from "./components/Download/Download";
import TopBar from "./components/TopBar/TopBar";
import Table from "./components/Table/Table";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        {/* Barra superiore con logo e logout */}
        <TopBar />

        {/* Layout principale a due colonne */}
        <main className="app-main">
          <section className="app-column left">
            <Upload />
          </section>

          <section className="app-column right">
            <Download />
          </section>
        </main>

        {/* Tabella job utente */}
        <section className="app-table-section">
          <Table />
        </section>
      </div>
    </AuthProvider>
  );
}

export default App;
