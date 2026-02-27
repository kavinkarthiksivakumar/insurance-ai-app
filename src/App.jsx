import React, { useState, useEffect } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Dashboard from "./pages/Dashboard";
import Claims from "./pages/Claims";
import NewClaim from "./pages/NewClaim";
import Reports from "./pages/Reports";

function App() {
  const [page, setPage] = useState("dashboard");
  const [claims, setClaims] = useState(() => {
    const saved = localStorage.getItem("claims");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("claims", JSON.stringify(claims));
  }, [claims]);

  const addClaim = (claim) => {
    setClaims((prev) => [...prev, { ...claim, id: Date.now() }]);
  };

  const updateStatus = (id, status) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  };

  const deleteClaim = (id) => {
    setClaims((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="app">
      <Sidebar setPage={setPage} page={page} />
      <div className="content-area">
        <Header claims={claims} />

        <div className="page-content">
          {page === "dashboard" && <Dashboard claims={claims} />}
          {page === "claims" && (
            <Claims
              claims={claims}
              updateStatus={updateStatus}
              deleteClaim={deleteClaim}
            />
          )}
          {page === "new" && <NewClaim addClaim={addClaim} />}
          {page === "reports" && <Reports claims={claims} />}
        </div>
      </div>
    </div>
  );
}

export default App;
