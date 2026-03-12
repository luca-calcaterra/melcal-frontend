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
          <svg className={`refresh-icon ${loading ? "loading" : ""}`} viewBox="0 0 64 25">
            <path d="M20.9844 10H17M20.9844 10V6M20.9844 10L17.6569 6.34315C14.5327 3.21895 9.46734 3.21895 6.34315 6.34315C3.21895 9.46734 3.21895 14.5327 6.34315 17.6569C9.46734 20.781 14.5327 20.781 17.6569 17.6569C18.4407 16.873 19.0279 15.9669 19.4184 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
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