import { useEffect, useMemo, useState } from "react";
import "./Table.css";
import { useAuth } from "../../auth/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts; // fallback se arriva un formato non ISO
  return d.toLocaleString();
}

function getStatusMeta(job) {
  const status = (job?.status || "").toLowerCase();
  // Nota: dal tuo backend vediamo anche "staging"/"unknown" ecc.
  if (status === "running") {
    return { label: "Running", type: "running", icon: "↻" };
  }
  if (status === "terminated") {
    return { label: "Terminated", type: "terminated", icon: "✓" };
  }
  if (status === "failed") {
    return { label: "Failed", type: "failed", icon: "✕", error: job?.error };
  }
  return { label: job?.status || "unknown", type: "unknown", icon: "•" };
}

export default function Table() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedJobId, setCopiedJobId] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/rfq-validation/jobs`, {
        method: "GET",
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Errore nel recupero dei job (${response.status})`);
      }

      const data = await response.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  const sortedJobs = useMemo(() => {
    // Ordina dal più recente (se timestamp valido)
    return [...jobs].sort((a, b) => {
      const ta = new Date(a?.timestamp || 0).getTime();
      const tb = new Date(b?.timestamp || 0).getTime();
      return tb - ta;
    });
  }, [jobs]);

  const copyToClipboard = async (jobId) => {
    try {
      await navigator.clipboard.writeText(jobId);
      setCopiedJobId(jobId);
      setTimeout(() => setCopiedJobId(null), 1500);
    } catch (err) {
      console.error("Clipboard error:", err);
    }
  };

  return (
    <div className="table-container">
      <div className="table-header">
        <h3 className="table-title">I tuoi job</h3>

        <button
          className="table-refresh"
          onClick={fetchJobs}
          disabled={loading}
          title="Aggiorna elenco"
        >
          Aggiorna
        </button>
      </div>

      {loading && <p>Caricamento...</p>}

      {!loading && sortedJobs.length === 0 && <p>Nessun job trovato</p>}

      {!loading && sortedJobs.length > 0 && (
        <div className="table-scroll">
          <table className="job-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Timestamp</th>
                <th>Stato</th>
                <th className="col-actions">Copia</th>
              </tr>
            </thead>

            <tbody>
              {sortedJobs.map((job) => {
                const meta = getStatusMeta(job);
                const isCopied = copiedJobId === job.id;

                return (
                  <tr key={job.id}>
                    <td className="job-id-cell">{job.id}</td>

                    <td className="job-ts-cell">{formatTimestamp(job.timestamp)}</td>

                    <td className="job-status-cell">
                      <span
                        className={`status-pill ${meta.type}`}
                        title={
                          meta.type === "failed" && meta.error
                            ? meta.error
                            : meta.label
                        }
                      >
                        <span
                          className={`status-icon ${meta.type}`}
                          aria-hidden="true"
                        >
                          {meta.icon}
                        </span>
                        <span className="status-text">{meta.label}</span>
                      </span>

                      {meta.type === "failed" && meta.error && (
                        <div className="status-error-inline">
                          {meta.error}
                        </div>
                      )}
                    </td>

                    <td className="col-actions">
                      <button
                        className="copy-btn"
                        onClick={() => copyToClipboard(job.id)}
                        title="Copia Job ID"
                      >
                        ⧉
                      </button>
                      {isCopied && <span className="copied-badge">Copiato</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
