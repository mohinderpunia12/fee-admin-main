import React from 'react';

interface Props {
  student: {
    first_name: string;
    last_name: string;
    admission_no?: string;
    classroom_name?: string;
    profile_picture_url?: string | null;
    mobile?: string | null;
    address?: string | null;
  };
  school: {
    name: string;
    logo_url?: string | null;
    email?: string | null;
    mobile?: string | null;
    address?: string | null;
  };
}

export const StudentIDStyle1: React.FC<Props> = ({ student, school }) => {
  return (
<div
  style={{
    width: "680px",
    height: "400px",
    backgroundColor: "#fff",
    fontFamily: "Arial, sans-serif",
    border: "1px solid #111111ff",
    display: "grid",
    gridTemplateColumns: "240px 1fr",
    padding: "24px",
    gap: "28px",
  }}
>
  {/* COL 1: School Logo/Name + Profile Photo */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: "16px",
    }}
  >
    {/* School Logo or Name */}
    {school.logo_url ? (
      <img
        src={school.logo_url}
        alt="School Logo"
        crossOrigin="anonymous"
        style={{ width: "80px", height: "80px", objectFit: "contain" }}
      />
    ) : (
      <div
        style={{
          fontSize: "20px",
          fontWeight: "800",
          color: "#000",
          textAlign: "center",
          lineHeight: 1.2,
          height: "70px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {school.name}
      </div>
    )}

    {/* Student Photo */}
    <div
      style={{
        border: "4px solid #8B1538",
        backgroundColor: "#fff",
        width: "180px",
        height: "220px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {student.profile_picture_url ? (
        <img
          src={student.profile_picture_url}
          alt="Student"
          crossOrigin="anonymous"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#8B1538",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{ color: "#fff", fontSize: "64px", fontWeight: "800" }}
          >
            {(student.first_name?.charAt(0) || "") +
              (student.last_name?.charAt(0) || "")}
          </span>
        </div>
      )}
    </div>

    {/* Barcode */}
    <div
      style={{
        height: "36px",
        width: "180px",
        background: "repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 5px)",
        borderRadius: "2px",
      }}
    ></div>
  </div>

  {/* COL 2: STUDENT CARD Heading + Name + Details */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
    }}
  >
    {/* RED STUDENT CARD HEADING */}
    <div
      style={{
        fontSize: "32px",
        fontWeight: "800",
        color: "#8B1538",
        letterSpacing: "3px",
        lineHeight: 1,
        marginBottom: "2px",
        height: "80px",
        display: "flex",
        alignItems: "center",
      }}
    >
      STUDENT CARD
    </div>

    {/* Student Name */}
    <div
      style={{
        fontSize: "26px",
        fontWeight: "800",
        color: "#000",
        lineHeight: 1.2,
        marginBottom: "8px",
        textTransform: "uppercase",
      }}
    >
      {student.first_name} {student.last_name}
    </div>

    {/* Details */}
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {[
        ["Student ID", student.admission_no || "123-456-7890"],
        ["Class", student.classroom_name || "Science A"],
        ["Gender", "Female"],
        ["Date of Birth", "January 18, 2005"],
        ["Valid Until", "June 2026"],
      ].map(([label, value]) => (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: "700",
              minWidth: "140px",
              color: "#000",
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontSize: "16px",
              fontWeight: "500",
              color: "#000",
            }}
          >
            : {value}
          </span>
        </div>
      ))}
    </div>
  </div>
</div>

  );
};

export default StudentIDStyle1;
