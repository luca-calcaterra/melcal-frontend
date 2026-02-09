import { useEffect, useState } from "react";
import "./Download.css";

const API_BASE_URL = "http://localhost:8000";

export default function Download({ initialJobId }) {
  const [jobId, setJobId] = useState("");
  const [popupMessage, setPopupMessage] = useState("");

  // Precompila SOLO se il job è stato appena creato
  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
    }
  }, [initialJobId]);

  const showPopup = (message) => {
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 3000);
  };

  const downloadFileFromUrl = async (url, filename) => {
    const response = await fetch(url);
    const blob = await response.blob();

    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const retrieveResults = async () => {
    if (!jobId.trim()) {
      showPopup("Inserisci un job_id valido");
      return;
    }

    try {
      // 1️⃣ Stato job
      const statusResponse = await fetch(
        `${API_BASE_URL}/jobs/${jobId}`
      );

      if (!statusResponse.ok) {
        throw new Error("Errore recupero stato job");
      }

      const jobStatus = await statusResponse.json();

      if (!jobStatus.completed && jobStatus.status === "running") {
        showPopup("Il job non è ancora terminato");
        return;
      }

      if (
        jobStatus.completed === true &&
        jobStatus.status === "terminated" &&
        !jobStatus.error
      ) {
        // 2️⃣ Download risultati
        const downloadResponse = await fetch(
          `${API_BASE_URL}/validation-results/download/${jobId}`,
          { method: "POST" }
        );

        if (!downloadResponse.ok) {
          throw new Error("Errore download risultati");
        }

        const { result_file } = await downloadResponse.json();

        await downloadFileFromUrl(
          result_file.url,
          result_file.name
        );
      }
    } catch (error) {
      console.error(error);
      showPopup("Errore nel recupero dei risultati");
    }
  };

  return (
    <div className="download-container">
      <h3>Download risultati</h3>

      <input
        type="text"
        placeholder="Inserisci job_id"
        value={jobId}
        onChange={(e) => setJobId(e.target.value)}
      />

      <button className="primary-button" onClick={retrieveResults}>
        Recupera risultati
      </button>

      {popupMessage && (
        <div className="popup">{popupMessage}</div>
      )}
    </div>
  );
}
