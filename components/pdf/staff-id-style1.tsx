import React from 'react';

interface Props {
  staff: {
    name: string;
    designation?: string;
    id?: string | number;
    profile_picture_url?: string | null;
    joining_date?: string | null;
  };
  school: {
    name: string;
    logo_url?: string | null;
    email?: string | null;
    mobile?: string | null;
    address?: string | null;
  };
}

export const StaffIDStyle1: React.FC<Props> = ({ staff, school }) => (
  <div
    style={{
      width: "400px",
      padding: "24px",
      backgroundColor: "#fff",
      fontFamily: "Arial, sans-serif",
      border: "1px solid #111",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "18px",
    }}
  >
    {/* School Logo or Name */}
    {school.logo_url ? (
      <img
        src={school.logo_url}
        alt="School Logo"
        crossOrigin="anonymous"
        style={{ width: "72px", height: "72px", objectFit: "contain" }}
      />
    ) : (
      <h2 style={{ fontSize: "22px", fontWeight: "700", textAlign: "center" }}>
        {school.name}
      </h2>
    )}

    {/* STAFF CARD TITLE */}
    <h1 style={{ fontSize: "28px", fontWeight: "800", textAlign: "center" }}>
      STAFF CARD
    </h1>

    {/* Profile Photo */}
    <div
      style={{
        border: "5px solid #8B1538",
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {staff.profile_picture_url ? (
        <img
          src={staff.profile_picture_url}
          alt="Staff"
          crossOrigin="anonymous"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#8B1538",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "#fff",
            fontSize: "42px",
            fontWeight: "800",
          }}
        >
          {(staff.name?.charAt(0) || 'S').toUpperCase()}
        </div>
      )}
    </div>

    {/* Staff Name */}
    <h3 style={{ fontSize: "20px", fontWeight: "700", textAlign: "center", textTransform: "uppercase" }}>
      {staff.name}
    </h3>

    {/* DETAILS */}
    <div
      style={{
        width: "100%",
        fontSize: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        paddingTop: "12px",
      }}
    >
      {[
        ["Staff ID", staff.id || "N/A"],
        ["Designation", staff.designation || "Staff Member"],
        ["Joining Date", staff.joining_date || "N/A"],
        ["Contact", school.mobile || "N/A"],
        ["Valid Until", "June 2026"],
      ].map(([label, value]) => (
        <div
          key={label}
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            paddingBottom: "6px",
          }}
        >
          <span style={{ fontWeight: "700", color: "#000" }}>{label}</span>
          <span style={{ fontWeight: "500", color: "#000" }}>{value}</span>
        </div>
      ))}
    </div>

    {/* School Contact + Address */}
    <div
      style={{
        fontSize: "14px",
        fontWeight: "600",
        textAlign: "center",
        paddingTop: "12px",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "4px"
      }}
    >
      {school.email && <div>Email: {school.email}</div>}
      {school.mobile && <div>Mobile: {school.mobile}</div>}
      {school.address && <div>Address: {school.address}</div>}
    </div>
  </div>
);
export default StaffIDStyle1;