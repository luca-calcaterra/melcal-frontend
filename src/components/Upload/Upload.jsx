import { useState } from "react";
import "./Upload.css";

const API_BASE_URL = "http://localhost:8000";

export default function Upload({ onJobStarted }) {
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [jobId, setJobId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" &&
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== selectedFiles.length) {
      setErrorMessage("Sono ammessi solo file PDF.");
      setTimeout(() => setErrorMessage(""), 3000);
    }

    setFiles(pdfFiles);
  };

  const startJob = async () => {
    if (files.length === 0) {
      setErrorMessage("Seleziona almeno un file PDF.");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    try {
      setStatus("uploading");
      setJobId(null); // reset box precedente

      // 1️⃣ Creazione job
      const uploadResponse = await fetch(
        `${API_BASE_URL}/rfq-documents/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documents: files.map((file, index) => [index + 1, file.name]),
          }),
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Errore nella creazione del job");
      }

      const { job_id, documents } = await uploadResponse.json();

      // 2️⃣ Upload file
      await Promise.all(
        documents.map(async ([_, fileName, uploadUrl]) => {
          const file = files.find((f) => f.name === fileName);

          if (!file) {
            throw new Error(`File ${fileName} non trovato`);
          }

          const putResponse = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
              "x-ms-blob-type": "BlockBlob",
              "Content-Type": "application/pdf",
            },
            body: file,
          });

          if (!putResponse.ok) {
            throw new Error(`Errore upload file ${fileName}`);
          }
        })
      );

      // 3️⃣ Avvio validazione
      const validationResponse = await fetch(
        `${API_BASE_URL}/rfq-validation/start/${job_id}`,
        { method: "POST" }
      );

      if (!validationResponse.ok) {
        throw new Error("Errore avvio validazione");
      }

      setJobId(job_id);
      onJobStarted?.(job_id);
      await navigator.clipboard.writeText(job_id); // copia automatica
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setJobId(null);

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }
  };

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

      {errorMessage && (
        <p className="status-message error">{errorMessage}</p>
      )}

      {status === "error" && (
        <p className="status-message error">
          Errore nel caricamento dei file
        </p>
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
