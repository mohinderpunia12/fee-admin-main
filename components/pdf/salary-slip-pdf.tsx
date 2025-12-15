import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { SalaryRecord } from '@/types';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2 solid #223E97',
    paddingBottom: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
    backgroundColor: '#F5F7FA',
    borderRadius: 4,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#223E97',
    marginBottom: 4,
  },
  schoolContact: {
    fontSize: 9,
    color: '#666',
    marginTop: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#223E97',
    marginVertical: 15,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#223E97',
    marginBottom: 8,
    borderBottom: '1 solid #E5E7EB',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '40%',
    fontSize: 10,
    color: '#666',
  },
  value: {
    width: '60%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1A1F36',
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#223E97',
    padding: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #E5E7EB',
    padding: 8,
  },
  tableCol1: {
    width: '60%',
    fontSize: 10,
  },
  tableCol2: {
    width: '40%',
    fontSize: 10,
    textAlign: 'right',
  },
  earningsSection: {
    width: '48%',
  },
  deductionsSection: {
    width: '48%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  summaryBox: {
    width: '48%',
    backgroundColor: '#F5F7FA',
    padding: 10,
    borderRadius: 4,
  },
  summaryLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#223E97',
  },
  netPayBox: {
    backgroundColor: '#10B981',
    color: 'white',
    padding: 15,
    borderRadius: 4,
    marginTop: 15,
    textAlign: 'center',
  },
  netPayLabel: {
    fontSize: 11,
    marginBottom: 5,
  },
  netPayValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1 solid #E5E7EB',
  },
  badge: {
    backgroundColor: '#10B981',
    color: 'white',
    padding: '4 8',
    borderRadius: 4,
    fontSize: 9,
    textAlign: 'center',
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  badgeUnpaid: {
    backgroundColor: '#EF4444',
  },
  watermark: {
    position: 'absolute',
    fontSize: 60,
    color: '#10B981',
    opacity: 0.1,
    transform: 'rotate(-45deg)',
    top: '40%',
    left: '20%',
  },
  note: {
    fontSize: 9,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  signature: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  signatureBox: {
    width: '45%',
    borderTop: '1 solid #666',
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#666',
    textAlign: 'center',
  },
});

interface SalarySlipPDFProps {
  salaryRecord: SalaryRecord;
  schoolName: string;
  staffName: string;
  designation?: string;
  employeeId?: string;
  department?: string;
  schoolLogoUrl?: string;
  schoolEmail?: string;
  schoolMobile?: string;
}

export const SalarySlipPDF: React.FC<SalarySlipPDFProps> = ({
  salaryRecord,
  schoolName,
  staffName,
  designation,
  employeeId,
  department,
  schoolLogoUrl,
  schoolEmail,
  schoolMobile,
}) => {
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const baseSalary = parseFloat(salaryRecord.base_salary || '0');
  const bonuses = parseFloat(salaryRecord.bonuses || '0');
  const netSalary = parseFloat(salaryRecord.net_salary || '0');

  // Calculate total allowances
  const allowances = salaryRecord.allowances || {};
  const totalAllowances = Object.values(allowances).reduce(
    (sum, val) => sum + parseFloat(String(val) || '0'),
    0
  );

  // Calculate total deductions
  const deductions = salaryRecord.deductions || {};
  const totalDeductions = Object.values(deductions).reduce(
    (sum, val) => sum + parseFloat(String(val) || '0'),
    0
  );

  const grossEarnings = baseSalary + totalAllowances + bonuses;

  // Extract transaction number from notes
  const extractTransactionNumber = (notes: string | null | undefined): string | null => {
    if (!notes) return null;
    const match = notes.match(/Transaction #:\s*(.+?)(?:\n|$)/i);
    return match ? match[1].trim() : null;
  };

  // Get notes without transaction number
  const getCleanNotes = (notes: string | null | undefined): string | null => {
    if (!notes) return null;
    const cleaned = notes.replace(/Transaction #:\s*.+?(?:\n|$)/gi, '').trim();
    return cleaned || null;
  };

  const transactionNumber = extractTransactionNumber(salaryRecord.notes);
  const cleanNotes = getCleanNotes(salaryRecord.notes);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {salaryRecord.paid && (
          <Text style={styles.watermark}>PAID</Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {/* School Logo */}
            {schoolLogoUrl ? (
              <Image src={schoolLogoUrl} style={styles.logo} />
            ) : (
              <View style={styles.logo} />
            )}
            <View style={styles.schoolInfo}>
              <Text style={styles.schoolName}>{schoolName}</Text>
              {schoolEmail && (
                <Text style={styles.schoolContact}>Email: {schoolEmail}</Text>
              )}
              {schoolMobile && (
                <Text style={styles.schoolContact}>Phone: {schoolMobile}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Salary Slip</Text>

        {/* Slip Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Slip No:</Text>
            <Text style={styles.value}>SAL-{salaryRecord.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Month/Year:</Text>
            <Text style={styles.value}>{months[salaryRecord.month]} {salaryRecord.year}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Date:</Text>
            <Text style={styles.value}>
              {salaryRecord.paid_on 
                ? new Date(salaryRecord.paid_on).toLocaleDateString('en-IN')
                : 'Not Paid'}
            </Text>
          </View>
        </View>

        {/* Employee Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employee Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Employee Name:</Text>
            <Text style={styles.value}>{staffName}</Text>
          </View>
          {employeeId && (
            <View style={styles.row}>
              <Text style={styles.label}>Employee ID:</Text>
              <Text style={styles.value}>{employeeId}</Text>
            </View>
          )}
          {designation && (
            <View style={styles.row}>
              <Text style={styles.label}>Designation:</Text>
              <Text style={styles.value}>{designation}</Text>
            </View>
          )}
          {department && (
            <View style={styles.row}>
              <Text style={styles.label}>Department:</Text>
              <Text style={styles.value}>{department}</Text>
            </View>
          )}
        </View>

        {/* Earnings and Deductions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Salary Breakdown</Text>
          
          {/* Earnings Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Earnings</Text>
              <Text style={styles.tableCol2}>Amount (₹)</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={styles.tableCol1}>Basic Salary</Text>
              <Text style={styles.tableCol2}>
                {baseSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            
            {/* Allowances */}
            {Object.entries(allowances).map(([key, value]) => (
              <View style={styles.tableRow} key={key}>
                <Text style={styles.tableCol1}>
                  {key.toUpperCase()}
                </Text>
                <Text style={styles.tableCol2}>
                  {parseFloat(String(value)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
            
            {/* Bonuses */}
            {bonuses > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCol1}>Bonus</Text>
                <Text style={styles.tableCol2}>
                  {bonuses.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}
            
            <View style={[styles.tableRow, { backgroundColor: '#F5F7FA' }]}>
              <Text style={[styles.tableCol1, { fontWeight: 'bold' }]}>Gross Earnings</Text>
              <Text style={[styles.tableCol2, { fontWeight: 'bold' }]}>
                {grossEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* Deductions Table */}
          {Object.keys(deductions).length > 0 && (
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableCol1}>Deductions</Text>
                <Text style={styles.tableCol2}>Amount (₹)</Text>
              </View>
              
              {Object.entries(deductions).map(([key, value]) => (
                <View style={styles.tableRow} key={key}>
                  <Text style={styles.tableCol1}>
                    {key.toUpperCase()}
                  </Text>
                  <Text style={styles.tableCol2}>
                    {parseFloat(String(value)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}
              
              <View style={[styles.tableRow, { backgroundColor: '#F5F7FA' }]}>
                <Text style={[styles.tableCol1, { fontWeight: 'bold' }]}>Total Deductions</Text>
                <Text style={[styles.tableCol2, { fontWeight: 'bold' }]}>
                  {totalDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Net Salary */}
        <View style={styles.netPayBox}>
          <Text style={styles.netPayLabel}>NET SALARY</Text>
          <Text style={styles.netPayValue}>
            ₹ {netSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {/* Payment Status */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={!salaryRecord.paid ? [styles.badge, styles.badgeUnpaid] : styles.badge}>
              {salaryRecord.paid ? 'PAID' : 'UNPAID'}
            </Text>
          </View>
          {salaryRecord.paid && salaryRecord.payment_mode && (
            <View style={styles.row}>
              <Text style={styles.label}>Payment Mode:</Text>
              <Text style={styles.value}>{salaryRecord.payment_mode.toUpperCase()}</Text>
            </View>
          )}
          {transactionNumber && (
            <View style={styles.row}>
              <Text style={styles.label}>Transaction Number:</Text>
              <Text style={styles.value}>{transactionNumber}</Text>
            </View>
          )}
        </View>

        {/* Notes */}
        {cleanNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.note}>{cleanNotes}</Text>
          </View>
        )}

        {/* Footer with Signatures */}
        <View style={styles.footer}>
          <View style={styles.signature}>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Employee's Signature</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            </View>
          </View>
          <Text style={[styles.note, { marginTop: 20, textAlign: 'center' }]}>
            This is a computer-generated salary slip and does not require a physical signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
