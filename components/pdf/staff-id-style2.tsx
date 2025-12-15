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

export const StaffIDStyle2: React.FC<Props> = ({ staff, school }) => (
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
        {staff.profile_picture_url ? (
          <img 
            src={staff.profile_picture_url} 
            alt="Staff" 
            style={{ width: '90px', height: '110px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
          />
        ) : (
          <div style={{ width: '90px', height: '110px', borderRadius: '4px', backgroundColor: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #cbd5e1' }}>
            <span style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold' }}>
              {(staff.name?.split(' ').map(n => n.charAt(0)).join('').substring(0, 2) || '').toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '70px' }}>Name:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{staff.name}</span>
        </div>

        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '70px' }}>Designation:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{staff.designation || 'Staff Member'}</span>
        </div>

        <div style={{ display: 'flex', marginBottom: '6px' }}>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 'bold', width: '70px' }}>Contact:</span>
          <span style={{ fontSize: '9px', color: '#1e293b', flex: 1 }}>{school.mobile || 'N/A'}</span>
        </div>
      </div>
    </div>
  </div>
);

export default StaffIDStyle2;
