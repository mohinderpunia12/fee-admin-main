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

export const StudentIDStyle2: React.FC<Props> = ({ student, school }) => (
  <div style={{ width: '350px', border: '2px solid #059669', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#fff', fontFamily: 'Arial, sans-serif' }}>
    {/* Header */}
    <div style={{ backgroundColor: '#059669', padding: '12px', textAlign: 'center' }}>
      {school.logo_url && (
        <img 
          src={school.logo_url} 
          alt="School Logo" 
          style={{ width: '50px', height: '50px', objectFit: 'contain', marginBottom: '6px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
        />
      )}
      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>{school.name}</div>
      <div style={{ fontSize: '8px', color: '#d1fae5', marginTop: '2px' }}>
        Email: {school.email || 'N/A'} | Phone: {school.mobile || 'N/A'}
      </div>
      <div style={{ fontSize: '8px', color: '#d1fae5', marginTop: '2px' }}>
        Address: {school.address || 'N/A'}
      </div>
    </div>

    {/* Body */}
    <div style={{ display: 'flex', padding: '16px', backgroundColor: '#ffffff' }}>
      <div style={{ width: '90px', marginRight: '12px', flexShrink: 0 }}>
        {student.profile_picture_url ? (
          <img 
            src={student.profile_picture_url} 
            alt="Student" 
            style={{ width: '90px', height: '110px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
          />
        ) : (
          <div style={{ width: '90px', height: '110px', borderRadius: '4px', backgroundColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1' }}>
            <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}>
              {(student.first_name?.charAt(0) || '') + (student.last_name?.charAt(0) || '')}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '60px' }}>Name:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{student.first_name} {student.last_name}</span>
        </div>

        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '60px' }}>Adm No:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{student.admission_no || 'N/A'}</span>
        </div>

        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '60px' }}>Contact:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{student.mobile || 'N/A'}</span>
        </div>

        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '60px' }}>Address:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{student.address || 'N/A'}</span>
        </div>

        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '60px' }}>Class:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{student.classroom_name || 'N/A'}</span>
        </div>
      </div>
    </div>
  </div>
);

export default StudentIDStyle2;
