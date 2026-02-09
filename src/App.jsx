import { useState } from "react";
import Upload from "./components/Upload/Upload";
import Download from "./components/Download/Download";
import TopBar from "./components/TopBar/TopBar";
import "./App.css";

function App() {
  const [jobId, setJobId] = useState(null);

  return (
    <div className="app-container">
      <TopBar />

      <main className="app-main">
        <section className="app-column left">
          <Upload onJobStarted={setJobId} />
        </section>

        <section className="app-column right">
          <Download initialJobId={jobId} />
        </section>
      </main>
    </div>
  );
}

export default App;
