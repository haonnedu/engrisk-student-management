"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string } | null | undefined;
  reset: () => void;
}) {
  // Ensure error is always a valid Error object
  const safeError = error || new Error("An unexpected error occurred");
  
  return (
    <html>
      <body>
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif"
        }}>
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            Something went wrong!
          </h2>
          {safeError?.message && (
            <p style={{ marginBottom: "1rem", color: "#666" }}>
              {safeError.message}
            </p>
          )}
          <button
            onClick={() => {
              try {
                reset();
              } catch (e) {
                window.location.href = "/";
              }
            }}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "0.25rem",
              cursor: "pointer"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

