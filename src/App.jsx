import { AuthProvider } from "./auth/AuthContext";
import { useAuth } from "./auth/useAuth";
import AuthLoading from "./components/AuthLoading/AuthLoading";

import Upload from "./components/Upload/Upload";
import Download from "./components/Download/Download";
import TopBar from "./components/TopBar/TopBar";
import Table from "./components/Table/Table";
import "./App.css";

function ProtectedApp() {
  const { loading, authenticated } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!authenticated) {
    return null;
  }

  return (
    <div className="app-container">
      <TopBar />

      <main className="app-main">
        <section className="app-column left">
          <Upload />
        </section>

        <section className="app-column right">
          <Download />
        </section>
      </main>

      <section className="app-table-section">
        <Table />
      </section>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}

export default App;