import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Share,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import RNPrint from 'react-native-print';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

import { RootState } from '../../store/store';
import { PayrollService } from '../../services/PayrollService';
import { PayrollRecord } from '../../entities/workforce/PayrollRecord';

interface PayslipsScreenProps {}

export const PayslipsScreen: React.FC<PayslipsScreenProps> = () => {
  const navigation = useNavigation();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [payslips, setPayslips] = useState<PayrollRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);
  const [showPayslipDetail, setShowPayslipDetail] = useState(false);

  const payrollService = new PayrollService();

  const availableYears = Array.from(
    { length: 5 }, 
    (_, i) => new Date().getFullYear() - i
  );

  useEffect(() => {
    loadPayslips();
  }, [selectedYear]);

  const loadPayslips = async () => {
    try {
      setIsLoading(true);
      const data = await payrollService.getEmployeePayslips(user.id, selectedYear);
      setPayslips(data);
    } catch (error) {
      console.error('Error loading payslips:', error);
      Alert.alert('Error', 'Failed to load payslips');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPayslips();
    setIsRefreshing(false);
  };

  const handlePayslipPress = (payslip: PayrollRecord) => {
    setSelectedPayslip(payslip);
    setShowPayslipDetail(true);
  };

  const handleDownloadPayslip = async (payslip: PayrollRecord) => {
    try {
      Alert.alert(
        'Download Payslip',
        'How would you like to get your payslip?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'View PDF', onPress: () => generatePDF(payslip) },
          { text: 'Print', onPress: () => printPayslip(payslip) },
          { text: 'Share', onPress: () => sharePayslip(payslip) }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process payslip');
    }
  };

  const generatePDF = async (payslip: PayrollRecord) => {
    try {
      const htmlContent = generatePayslipHTML(payslip);
      
      const options = {
        html: htmlContent,
        fileName: `Payslip_${payslip.payrollNumber}`,
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      Alert.alert('Success', `Payslip saved to: ${file.filePath}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const printPayslip = async (payslip: PayrollRecord) => {
    try {
      const htmlContent = generatePayslipHTML(payslip);
      
      await RNPrint.print({
        html: htmlContent,
        jobName: `Payslip_${payslip.payrollNumber}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to print payslip');
    }
  };

  const sharePayslip = async (payslip: PayrollRecord) => {
    try {
      const htmlContent = generatePayslipHTML(payslip);
      const file = await RNHTMLtoPDF.convert({
        html: htmlContent,
        fileName: `Payslip_${payslip.payrollNumber}`,
        directory: 'Documents',
      });

      await Share.share({
        url: `file://${file.filePath}`,
        title: `Payslip ${payslip.payrollNumber}`,
        message: `Your payslip for ${formatPayPeriod(payslip.payPeriodStart, payslip.payPeriodEnd)}`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payslip');
    }
  };

  const generatePayslipHTML = (payslip: PayrollRecord): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Payslip ${payslip.payrollNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
            .company-name { font-size: 24px; font-weight: bold; color: #333; }
            .payslip-title { font-size: 18px; margin: 10px 0; }
            .employee-info { margin: 20px 0; }
            .pay-details { display: flex; justify-content: space-between; margin: 20px 0; }
            .earnings, .deductions { width: 48%; }
            .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .table th { background-color: #f5f5f5; }
            .total-row { font-weight: bold; background-color: #f0f0f0; }
            .net-pay { text-align: center; font-size: 20px; font-weight: bold; color: #27ae60; margin: 20px 0; padding: 15px; border: 2px solid #27ae60; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">WriteCareNotes Healthcare</div>
            <div class="payslip-title">PAYSLIP</div>
          </div>
          
          <div class="employee-info">
            <p><strong>Employee:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Employee ID:</strong> ${user.employeeNumber || user.id}</p>
            <p><strong>Pay Period:</strong> ${formatPayPeriod(payslip.payPeriodStart, payslip.payPeriodEnd)}</p>
            <p><strong>Pay Date:</strong> ${new Date(payslip.payDate).toLocaleDateString()}</p>
            <p><strong>Payslip Number:</strong> ${payslip.payrollNumber}</p>
          </div>

          <div class="pay-details">
            <div class="earnings">
              <h3>Earnings</h3>
              <table class="table">
                <tr><td>Basic Pay</td><td>£${payslip.earnings.basicPay.toFixed(2)}</td></tr>
                <tr><td>Overtime Pay</td><td>£${payslip.earnings.overtimePay.toFixed(2)}</td></tr>
                <tr><td>Holiday Pay</td><td>£${payslip.earnings.holidayPay.toFixed(2)}</td></tr>
                <tr><td>Sick Pay</td><td>£${payslip.earnings.sickPay.toFixed(2)}</td></tr>
                <tr><td>Bonuses</td><td>£${payslip.earnings.bonuses.toFixed(2)}</td></tr>
                <tr><td>Allowances</td><td>£${payslip.earnings.allowances.toFixed(2)}</td></tr>
                <tr class="total-row"><td>Gross Pay</td><td>£${payslip.earnings.grossPay.toFixed(2)}</td></tr>
              </table>
              
              <h3>Hours</h3>
              <table class="table">
                <tr><td>Regular Hours</td><td>${payslip.hours.regularHours.toFixed(2)}</td></tr>
                <tr><td>Overtime Hours</td><td>${payslip.hours.overtimeHours.toFixed(2)}</td></tr>
                <tr><td>Holiday Hours</td><td>${payslip.hours.holidayHours.toFixed(2)}</td></tr>
                <tr><td>Sick Hours</td><td>${payslip.hours.sickHours.toFixed(2)}</td></tr>
                <tr class="total-row"><td>Total Hours</td><td>${payslip.hours.totalHours.toFixed(2)}</td></tr>
              </table>
            </div>

            <div class="deductions">
              <h3>Deductions</h3>
              <table class="table">
                <tr><td>Income Tax</td><td>£${payslip.deductions.incomeTax.toFixed(2)}</td></tr>
                <tr><td>National Insurance</td><td>£${payslip.deductions.nationalInsurance.toFixed(2)}</td></tr>
                <tr><td>Pension Contribution</td><td>£${payslip.deductions.pensionContribution.toFixed(2)}</td></tr>
                <tr><td>Student Loan</td><td>£${payslip.deductions.studentLoan.toFixed(2)}</td></tr>
                <tr><td>Other Deductions</td><td>£${payslip.deductions.other.toFixed(2)}</td></tr>
                <tr class="total-row"><td>Total Deductions</td><td>£${payslip.deductions.totalDeductions.toFixed(2)}</td></tr>
              </table>

              <h3>Tax Codes</h3>
              <table class="table">
                <tr><td>Income Tax Code</td><td>${payslip.taxCodes.incomeTaxCode}</td></tr>
                <tr><td>NI Category</td><td>${payslip.taxCodes.nationalInsuranceCategory}</td></tr>
              </table>
            </div>
          </div>

          <div class="net-pay">
            NET PAY: £${payslip.netPay.toFixed(2)}
          </div>

          <p style="font-size: 12px; color: #666; text-align: center; margin-top: 30px;">
            This payslip is computer generated and does not require a signature.<br>
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </p>
        </body>
      </html>
    `;
  };

  const formatPayPeriod = (start: Date, end: Date): string => {
    return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
  };

  const formatCurrency = (amount: number): string => {
    return `£${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'PAID': return '#27ae60';
      case 'APPROVED': return '#f39c12';
      case 'CALCULATED': return '#3498db';
      default: return '#95a5a6';
    }
  };

  const renderPayslipItem = ({ item }: { item: PayrollRecord }) => (
    <TouchableOpacity
      style={styles.payslipCard}
      onPress={() => handlePayslipPress(item)}
    >
      <View style={styles.payslipHeader}>
        <View>
          <Text style={styles.payslipNumber}>{item.payrollNumber}</Text>
          <Text style={styles.payPeriod}>
            {formatPayPeriod(item.payPeriodStart, item.payPeriodEnd)}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>

      <View style={styles.payslipDetails}>
        <View style={styles.payAmount}>
          <Text style={styles.grossPayLabel}>Gross Pay</Text>
          <Text style={styles.grossPayAmount}>{formatCurrency(item.earnings.grossPay)}</Text>
        </View>
        <View style={styles.payAmount}>
          <Text style={styles.netPayLabel}>Net Pay</Text>
          <Text style={styles.netPayAmount}>{formatCurrency(item.netPay)}</Text>
        </View>
      </View>

      <View style={styles.payslipFooter}>
        <View style={styles.hoursInfo}>
          <Icon name="access-time" size={16} color="#666" />
          <Text style={styles.hoursText}>{item.hours.totalHours.toFixed(1)} hours</Text>
        </View>
        <TouchableOpacity
          style={styles.downloadButton}
          onPress={() => handleDownloadPayslip(item)}
        >
          <Icon name="download" size={20} color="#667eea" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderPayslipDetail = () => {
    if (!selectedPayslip) return null;

    return (
      <Modal
        visible={showPayslipDetail}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPayslipDetail(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Payslip Details</Text>
            <TouchableOpacity onPress={() => handleDownloadPayslip(selectedPayslip)}>
              <Icon name="download" size={24} color="#667eea" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>Pay Information</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payslip Number:</Text>
                <Text style={styles.detailValue}>{selectedPayslip.payrollNumber}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pay Period:</Text>
                <Text style={styles.detailValue}>
                  {formatPayPeriod(selectedPayslip.payPeriodStart, selectedPayslip.payPeriodEnd)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pay Date:</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedPayslip.payDate).toLocaleDateString()}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>Earnings</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Basic Pay:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedPayslip.earnings.basicPay)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Overtime Pay:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedPayslip.earnings.overtimePay)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Holiday Pay:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedPayslip.earnings.holidayPay)}</Text>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Gross Pay:</Text>
                <Text style={styles.totalValue}>{formatCurrency(selectedPayslip.earnings.grossPay)}</Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>Deductions</Text>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Income Tax:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedPayslip.deductions.incomeTax)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>National Insurance:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedPayslip.deductions.nationalInsurance)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Pension:</Text>
                <Text style={styles.detailValue}>{formatCurrency(selectedPayslip.deductions.pensionContribution)}</Text>
              </View>
              <View style={[styles.detailRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total Deductions:</Text>
                <Text style={styles.totalValue}>{formatCurrency(selectedPayslip.deductions.totalDeductions)}</Text>
              </View>
            </View>

            <View style={styles.netPayCard}>
              <Text style={styles.netPayLabel}>NET PAY</Text>
              <Text style={styles.netPayValue}>{formatCurrency(selectedPayslip.netPay)}</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.yearSelector}
          onPress={() => setShowYearPicker(true)}
        >
          <Text style={styles.yearText}>{selectedYear}</Text>
          <Icon name="arrow-drop-down" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading payslips...</Text>
        </View>
      ) : (
        <FlatList
          data={payslips}
          renderItem={renderPayslipItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#fff"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={64} color="rgba(255,255,255,0.5)" />
              <Text style={styles.emptyText}>No payslips found for {selectedYear}</Text>
            </View>
          }
        />
      )}

      {/* Year Picker Modal */}
      <Modal
        visible={showYearPicker}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.yearPickerContainer}>
          <View style={styles.yearPickerHeader}>
            <TouchableOpacity onPress={() => setShowYearPicker(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.yearPickerTitle}>Select Year</Text>
            <TouchableOpacity onPress={() => setShowYearPicker(false)}>
              <Text style={styles.doneButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={availableYears}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.yearItem,
                  item === selectedYear && styles.selectedYearItem
                ]}
                onPress={() => {
                  setSelectedYear(item);
                  setShowYearPicker(false);
                }}
              >
                <Text style={[
                  styles.yearItemText,
                  item === selectedYear && styles.selectedYearText
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.toString()}
          />
        </View>
      </Modal>

      {renderPayslipDetail()}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  yearText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
  },
  payslipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  payslipNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  payPeriod: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  payslipDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  payAmount: {
    flex: 1,
  },
  grossPayLabel: {
    fontSize: 12,
    color: '#666',
  },
  grossPayAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  netPayLabel: {
    fontSize: 12,
    color: '#666',
  },
  netPayAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  payslipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hoursText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  downloadButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  yearPickerContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  yearPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  doneButton: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  yearItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  selectedYearItem: {
    backgroundColor: '#f0f0f0',
  },
  yearItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  selectedYearText: {
    fontWeight: 'bold',
    color: '#667eea',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 8,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  netPayCard: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  netPayLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  netPayValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default PayslipsScreen;