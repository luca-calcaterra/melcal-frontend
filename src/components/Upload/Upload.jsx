import { useRef, useState } from "react";
import "./Upload.css";
import { useAuth } from "../../auth/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Upload({ onJobStarted }) {
  const { token } = useAuth();
  const fileInputRef = useRef(null);

  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("idle"); // idle | uploading | success | error
  const [jobId, setJobId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const showTemporaryError = (message) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(""), 3000);
  };

  const openFilePicker = () => {
    if (status === "uploading") return;
    fileInputRef.current?.click();
  };

  // Aggiunge nuovi file senza perdere quelli già selezionati
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    const pdfFiles = selectedFiles.filter(
      (file) =>
        file.type === "application/pdf" &&
        file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== selectedFiles.length) {
      showTemporaryError("Sono ammessi solo file PDF");
    }

    setFiles((prevFiles) => {
      const existingKeys = new Set(
        prevFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`)
      );

      const newUniqueFiles = pdfFiles.filter((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        return !existingKeys.has(key);
      });

      return [...prevFiles, ...newUniqueFiles];
    });

    // reset dell'input: permette di riselezionare lo stesso file dopo una rimozione
    e.target.value = "";
  };

  const removeFile = (fileToRemove) => {
    if (status === "uploading") return;

    setFiles((prevFiles) =>
      prevFiles.filter(
        (file) =>
          !(
            file.name === fileToRemove.name &&
            file.size === fileToRemove.size &&
            file.lastModified === fileToRemove.lastModified
          )
      )
    );
  };

  const startJob = async () => {
    if (files.length === 0) {
      showTemporaryError("Seleziona almeno un file PDF");
      return;
    }

    try {
      setStatus("uploading");
      setJobId(null);

      // 1️⃣ STAGE
      const bodyPayload = {
        documents: files.map((file, index) => ({
          id: index.toString(),
          name: file.name,
        })),
        token_expiration_seconds: 600,
      };

      const stageResponse = await fetch(`${API_BASE_URL}/rfq-validation/stage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bodyPayload),
      });

      if (!stageResponse.ok) {
        throw new Error("Errore nella creazione del job");
      }

      const stageData = await stageResponse.json();
      const job_id = stageData.job_id;
      const documents = stageData.upload.documents;

      // 2️⃣ UPLOAD SU BLOB
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

      // 3️⃣ AVVIO JOB
      const startResponse = await fetch(
        `${API_BASE_URL}/rfq-validation/jobs/${job_id}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            data_extraction: {
              requirements: {
                categories: [],
              },
              general_info: {
                skip: false,
              },
            },
          }),
        }
      );

      if (!startResponse.ok) {
        throw new Error("Errore nell'avvio del job");
      }

      const startData = await startResponse.json();

      if (!startData.started) {
        throw new Error(
          startData.error || "Il job non è stato avviato correttamente"
        );
      }

      setJobId(job_id);
      onJobStarted?.(job_id);
      setStatus("success");
      setTimeout(() => {
        setJobId(null);
      }, 5000); // Box verde sparisce dopo 5"
    } catch (error) {
      console.error(error);
      setStatus("error");
      setJobId(null);
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  const copyJobId = async () => {
    if (!jobId) return;
    try {
      await navigator.clipboard.writeText(jobId);
    } catch (err) {
      console.error("Errore copia clipboard:", err);
    }
  };

  return (
    <div className="upload-container">
      <h3 className="upload-title">Carica nuovi documenti</h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileChange}
        className="hidden-file-input"
      />

      <div className="file-boxes-container">
        {files.map((file) => {
          const fileKey = `${file.name}-${file.size}-${file.lastModified}`;

          return (
            <div className="file-item" key={fileKey}>
              <div className="file-box uploaded-file" title={file.name}>
                <span className="file-name">{file.name}</span>
              </div>

              <button
                type="button"
                className="delete-file-button"
                onClick={() => removeFile(file)}
                title={`Rimuovi ${file.name}`}
                aria-label={`Rimuovi ${file.name}`}
                disabled={status === "uploading"}
              >
                <svg
                  className="trash-icon"
                  viewBox="0 0 50 50"
                >
                  <path d="M20 18h2v16h-2z"/>
                  <path d="M24 18h2v16h-2z"/>
                  <path d="M28 18h2v16h-2z"/>
                  <path d="M12 12h26v2H12z"/>
                  <path d="M30 12h-2v-1c0-.6-.4-1-1-1h-4c-.6 0-1 .4-1 1v1h-2v-1c0-1.7 1.3-3 3-3h4c1.7 0 3 1.3 3 3v1z"/>
                  <path d="M31 40H19c-1.6 0-3-1.3-3.2-2.9l-1.8-24 2-.2 1.8 24c0 .6.6 1.1 1.2 1.1h12c.6 0 1.1-.5 1.2-1.1l1.8-24 2 .2-1.8 24C34 38.7 32.6 40 31 40z"/>
                </svg>
              </button>
            </div>
          );
        })}

        <button
          type="button"
          className="file-box add-file-box"
          onClick={openFilePicker}
          disabled={status === "uploading"}
        >
          + Aggiungi file
        </button>
      </div>

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
            <strong>Job avviato con successo</strong>
            <span className="job-id">{jobId}</span>
          </div>

          <button
            className="copy-icon-button"
            onClick={copyJobId}
            title="Copia Job ID"
          >
            <svg
              className="copy-icon"
              viewBox="0 0 64 64"
            >
              <rect x="11.13" y="17.72" width="33.92" height="36.85" rx="2.5"/>
              <path 
                d="M19.35,14.23V13.09a3.51,3.51,0,0,1,3.33-3.66H49.54a3.51,3.51,0,0,1,3.33,3.66V42.62a3.51,3.51,0,0,1-3.33,3.66H48.39"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}