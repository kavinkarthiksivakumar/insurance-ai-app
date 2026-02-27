import React from "react";

export default function Reports({ claims }) {
  return (
    <div className="reports-box">
      <h3>Reports Summary</h3>
      <p>Total Claims: {claims.length}</p>
      <p>Pending: {claims.filter((c) => c.status === "Pending").length}</p>
      <p>Approved: {claims.filter((c) => c.status === "Approved").length}</p>
      <p>Rejected: {claims.filter((c) => c.status === "Rejected").length}</p>
    </div>
  );
}
