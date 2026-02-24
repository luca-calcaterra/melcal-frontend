import { useEffect, useMemo, useState } from "react";
import "./Table.css";
import { useAuth } from "../../auth/useAuth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function formatTimestamp(ts) {
  if (!ts) return "-";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

function getStatusMeta(job) {
  const status = (job?.status || "").toLowerCase();

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

      const response = await fetch(`${API_BASE_URL}/rfq-validation/jobs?completed=true&status=terminated`, {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const sortedJobs = useMemo(() => {
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
                <th className="col-jobid">Job ID</th>
                <th className="col-timestamp">Timestamp</th>
                <th className="col-status">Stato</th>
              </tr>
            </thead>

            <tbody>
              {sortedJobs.map((job) => {
                const meta = getStatusMeta(job);
                const isCopied = copiedJobId === job.id;

                return (
                  <tr key={job.id}>
                    <td className="col-jobid">
                      <div className="jobid-wrapper">
                        <span className="job-id-cell" title={job.id}>
                          {job.id}
                        </span>

                        <button
                          className="copy-btn"
                          onClick={() => copyToClipboard(job.id)}
                          title="Copia Job ID"
                        >
                          ⧉
                        </button>
                      </div>

                      {isCopied && <span className="copied-badge">Copiato</span>}
                    </td>

                    <td className="col-timestamp job-ts-cell">
                      {formatTimestamp(job.timestamp)}
                    </td>

                    <td className="col-status job-status-cell">
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
                        <div className="status-error-inline">{meta.error}</div>
                      )}
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