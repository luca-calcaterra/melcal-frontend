import { useState } from "react";
import "./Upload.css";

const API_BASE_URL = "http://localhost:8000"; // modifica se necessario

export default function Upload({ onJobStarted }) {
  const [isOpen, setIsOpen] = useState(false);
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

      // 1️⃣ POST rfq-documents/upload
      const uploadResponse = await fetch(
        `${API_BASE_URL}/rfq-documents/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documents: files.map((file, index) => [index + 1, file.name]),
          }),
        }
      );

      if (!uploadResponse.ok) {
        throw new Error("Errore nella creazione del job");
      }

      const { job_id, documents } = await uploadResponse.json();

      // 2️⃣ Upload file su Azure Blob (PUT su SAS URL)
      await Promise.all(
        documents.map(async ([index, fileName, uploadUrl]) => {
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
        {
          method: "POST",
        }
      );

      if (!validationResponse.ok) {
        throw new Error("Errore avvio validazione");
      }

      setJobId(job_id);
      onJobStarted?.(job_id);
      setStatus("success");
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      setStatus("error");
      setIsOpen(false);

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
      <button className="primary-button" onClick={() => setIsOpen(true)}>
        Carica nuovi documenti
      </button>

      {isOpen && (
        <div className="upload-modal">
          <h3>Caricamento documenti PDF</h3>

          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleFileChange}
          />

          <div className="modal-actions">
            <button className="secondary-button" onClick={() => setIsOpen(false)}>
              Annulla
            </button>
            <button className="primary-button" onClick={startJob}>
              Inizia job
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="status-message error">
          Errore nel caricamento dei file
        </p>
      )}

      {status === "success" && (
        <div className="status-message success">
          <span>Job {jobId} avviato</span>
          <button className="copy-button" onClick={copyJobId}>
            Copia ID
          </button>
        </div>
      )}
    </div>
  );
}
