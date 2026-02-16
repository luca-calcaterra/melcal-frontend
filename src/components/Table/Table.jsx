import { useEffect, useState } from "react";
import "./Table.css";
import { useAuth } from "../../auth/useAuth";

const API_BASE_URL =
  "https://melcal-function-app-fehvdpdtg8ewgcah.eastus-01.azurewebsites.net";

export default function Table() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/rfq-validation/jobs`,
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Errore nel recupero dei job");
      }

      const data = await response.json();
      setJobs(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchJobs();
    }
  }, [token]);

  return (
    <div className="table-container">
      <h3>I tuoi job</h3>

      {loading && <p>Caricamento...</p>}

      {!loading && jobs.length === 0 && (
        <p>Nessun job trovato</p>
      )}

      {!loading && jobs.length > 0 && (
        <table className="job-table">
          <thead>
            <tr>
              <th>Job ID</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="job-id-cell">{job.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
