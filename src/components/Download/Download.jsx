import { useEffect, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import "./Download.css";

export default function Download({ initialJobId }) {
  const { token } = useAuth();
  const [jobId, setJobId] = useState("");
  const [popupMessage, setPopupMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Precompila SOLO se il job è stato appena creato
  useEffect(() => {
    if (initialJobId) {
      setJobId(initialJobId);
    }
  }, [initialJobId]);

  const showPopup = (message) => {
    setErrorMessage("");
    setPopupMessage(message);
    setTimeout(() => setPopupMessage(""), 4000);
  };

  const showError = (message) => {
    setPopupMessage("");
    setErrorMessage(message);
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
      setErrorMessage("");
      setPopupMessage("");

      // 1️⃣ Recupero stato job
      const statusResponse = await fetch(
        `/rfq-validation/jobs/${jobId}`,
        {
          method: "GET",
          headers: {
            "accept": "application/json",
            "Authorization": `Bearer ${token}`
          },
        }
      );

      if (!statusResponse.ok) {
        throw new Error("Errore recupero stato job");
      }

      const jobStatus = await statusResponse.json();

      // ✅ JOB COMPLETATO
      if (jobStatus.completed === true) {
        const downloadResponse = await fetch(
          `/validation-results/download/${jobId}`, { 
            method: "POST", 
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`
            },
          }
        );

        if (!downloadResponse.ok) {
          throw new Error("Errore download risultati");
        }

        const { result_file } = await downloadResponse.json();

        await downloadFileFromUrl(
          result_file.url,
          result_file.name
        );

        showPopup("Download avviato");
        return;
      }

      // ❌ JOB NON COMPLETATO → analizziamo status
      switch (jobStatus.status) {
        case "staging":
          showPopup("Job in attesa di esecuzione. Riprova più tardi.");
          break;

        case "running":
          showPopup("Job in esecuzione. Riprova più tardi.");
          break;

        case "failed":
          showError(
            jobStatus.error
              ? `Esecuzione fallita: ${jobStatus.error}`
              : "Esecuzione fallita"
          );
          break;

        default:
          showPopup("Stato job sconosciuto");
      }
    } catch (error) {
      console.error(error);
      showError(`${error}`);
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
        <div className="popup info">{popupMessage}</div>
      )}

      {errorMessage && (
        <div className="popup error">{errorMessage}</div>
      )}
    </div>
  );
}
