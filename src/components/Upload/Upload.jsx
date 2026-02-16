import { useState } from "react";
import "./Upload.css";
import { useAuth } from "../../auth/useAuth";

export default function Upload({ onJobStarted }) {
  const { token } = useAuth();
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [jobId, setJobId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Gestione selezione file
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" &&
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== selectedFiles.length) {
      setErrorMessage("Sono ammessi solo file PDF");
      setTimeout(() => setErrorMessage(""), 3000);
    }

    setFiles(pdfFiles);
  };

  // Avvio job
  const startJob = async () => {
    if (files.length === 0) {
      setErrorMessage("Seleziona almeno un file PDF");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setStatus("uploading");
      setJobId(null); // reset box precedente

      // 1️⃣ POST rfq-validation/stage
      const bodyPayload = {
        documents: files.map((file, index) => ({
          id: index.toString(),
          name: file.name,
        })),
        token_expiration_seconds: 600,
      };

      const stageResponse = await fetch(`/api/rfq-validation/stage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!stageResponse.ok) {
        throw new Error("Errore nella creazione del job");
      }

      const stageData = await stageResponse.json();
      const job_id = stageData.job_id;
      const documents = stageData.upload.documents;

      // 2️⃣ Upload dei file sui SAS URL
      await Promise.all(
        documents.map(async (doc) => {
          const file = files.find((f) => f.name === doc.name);
          if (!file) throw new Error(`File ${doc.name} non trovato`);

          const putResponse = await fetch(doc.sas_url, {
            method: "PUT",
            headers: {
              "x-ms-blob-type": "BlockBlob",
              "Content-Type": "application/pdf",
            },
            body: file,
          });

          if (!putResponse.ok) {
            throw new Error(`Errore upload file ${doc.name}`);
          }
        })
      );

      // ✅ Job avviato con successo
      setJobId(job_id);
      onJobStarted?.(job_id);
      await navigator.clipboard.writeText(job_id); // copia automatica
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setJobId(null);

      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  // Copia Job ID
  const copyJobId = async () => {
    if (!jobId) return;
    await navigator.clipboard.writeText(jobId);
  };

  return (
    <div className="upload-container">
      <h3 className="upload-title">Carica nuovi documenti</h3>

      <input
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileChange}
      />

      <button
        className="primary-button"
        onClick={startJob}
        disabled={status === "uploading"}
      >
        {status === "uploading" ? "Caricamento in corso..." : "Inizia Job"}
      </button>

      {errorMessage && <p className="status-message error">{errorMessage}</p>}
      {status === "error" && (
        <p className="status-message error">Errore nel caricamento dei file</p>
      )}

      {jobId && (
        <div className="job-success-box">
          <div className="job-success-text">
            <strong>Job avviato. Id copiato negli appunti</strong>
            <span className="job-id">{jobId}</span>
          </div>

          <button
            className="copy-icon-button"
            onClick={copyJobId}
            title="Copia Job ID"
          >
            ⧉
          </button>
        </div>
      )}
    </div>
  );
}
