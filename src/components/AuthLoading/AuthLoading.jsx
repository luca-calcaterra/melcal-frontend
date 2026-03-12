import "./AuthLoading.css";

export default function AuthLoading() {
  return (
    <div className="auth-loading-container">
      <div className="auth-spinner"></div>
      <p>Caricamento..</p>
    </div>
  );
}