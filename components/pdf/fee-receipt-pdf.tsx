import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { FeeRecord } from '@/types';

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
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#F5F7FA',
    padding: 8,
    marginTop: 5,
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
    marginTop: 40,
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

interface FeeReceiptPDFProps {
  feeRecord: FeeRecord;
  schoolName: string;
  studentName: string;
  className?: string;
  admissionNo?: string;
  fatherName?: string;
  schoolLogoUrl?: string;
  schoolEmail?: string;
  schoolMobile?: string;
}

export const FeeReceiptPDF: React.FC<FeeReceiptPDFProps> = ({
  feeRecord,
  schoolName,
  studentName,
  className,
  admissionNo,
  fatherName,
  schoolLogoUrl,
  schoolEmail,
  schoolMobile,
}) => {
  const months = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const totalAmount = parseFloat(feeRecord.total_amount || '0');
  const lateFee = parseFloat(feeRecord.late_fee || '0');
  const discount = parseFloat(feeRecord.discount || '0');
  const finalAmount = totalAmount + lateFee - discount;

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

  const transactionNumber = extractTransactionNumber(feeRecord.notes);
  const cleanNotes = getCleanNotes(feeRecord.notes);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {feeRecord.paid && (
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
        <Text style={styles.title}>Fee Receipt</Text>

        {/* Receipt Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Receipt No:</Text>
            <Text style={styles.value}>FEE-{feeRecord.id}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>
              {feeRecord.paid_on 
                ? new Date(feeRecord.paid_on).toLocaleDateString('en-IN')
                : new Date().toLocaleDateString('en-IN')}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Academic Year:</Text>
            <Text style={styles.value}>{feeRecord.academic_year}</Text>
          </View>
        </View>

        {/* Student Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Student Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Student Name:</Text>
            <Text style={styles.value}>{studentName}</Text>
          </View>
          {admissionNo && (
            <View style={styles.row}>
              <Text style={styles.label}>Admission No:</Text>
              <Text style={styles.value}>{admissionNo}</Text>
            </View>
          )}
          {className && (
            <View style={styles.row}>
              <Text style={styles.label}>Class:</Text>
              <Text style={styles.value}>{className}</Text>
            </View>
          )}
          {fatherName && (
            <View style={styles.row}>
              <Text style={styles.label}>Father's Name:</Text>
              <Text style={styles.value}>{fatherName}</Text>
            </View>
          )}
        </View>

        {/* Fee Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fee Details - {months[feeRecord.month]} {feeRecord.year}</Text>
          
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Particulars</Text>
              <Text style={styles.tableCol2}>Amount (₹)</Text>
            </View>
            
            {/* Fee Components */}
            {feeRecord.fee_components && Object.entries(feeRecord.fee_components).map(([key, value]) => (
              <View style={styles.tableRow} key={key}>
                <Text style={styles.tableCol1}>
                  {key.charAt(0).toUpperCase() + key.slice(1)} Fee
                </Text>
                <Text style={styles.tableCol2}>
                  {parseFloat(String(value)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))}
            
            {/* Subtotal */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCol1, { fontWeight: 'bold' }]}>Subtotal</Text>
              <Text style={[styles.tableCol2, { fontWeight: 'bold' }]}>
                {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            
            {/* Late Fee */}
            {lateFee > 0 && (
              <View style={styles.tableRow}>
                <Text style={styles.tableCol1}>Late Fee</Text>
                <Text style={styles.tableCol2}>
                  {lateFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}
            
            {/* Discount */}
            {discount > 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCol1, { color: '#10B981' }]}>Discount</Text>
                <Text style={[styles.tableCol2, { color: '#10B981' }]}>
                  - {discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            )}
            
            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={[styles.tableCol1, { fontSize: 12 }]}>Total Amount</Text>
              <Text style={[styles.tableCol2, { fontSize: 12 }]}>
                ₹ {finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Payment Status:</Text>
            <Text style={!feeRecord.paid ? [styles.badge, styles.badgeUnpaid] : styles.badge}>
              {feeRecord.paid ? 'PAID' : 'UNPAID'}
            </Text>
          </View>
          {feeRecord.paid && feeRecord.payment_mode && (
            <View style={styles.row}>
              <Text style={styles.label}>Payment Mode:</Text>
              <Text style={styles.value}>{feeRecord.payment_mode.toUpperCase()}</Text>
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
              <Text style={styles.signatureLabel}>Parent's Signature</Text>
            </View>
            <View style={styles.signatureBox}>
              <Text style={styles.signatureLabel}>Authorized Signatory</Text>
            </View>
          </View>
          <Text style={[styles.note, { marginTop: 20, textAlign: 'center' }]}>
            This is a computer-generated receipt and does not require a physical signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
};
