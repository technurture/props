import mongoose from 'mongoose';
import Billing from '@/models/Billing';
import ServiceCharge from '@/models/ServiceCharge';
import PatientVisit from '@/models/PatientVisit';

export async function addConsultationFeeToVisit(
  visitId: string,
  branchId: string,
  patientId: string,
  createdById: string
): Promise<{ success: boolean; billing?: any; message?: string }> {
  try {
    const existingConsultationBilling = await Billing.findOne({
      visit: visitId,
      'items.category': 'consultation'
    });

    if (existingConsultationBilling) {
      return {
        success: true,
        message: 'Consultation fee already exists for this visit'
      };
    }

    const consultationServiceCharge = await ServiceCharge.findOne({
      branch: branchId,
      category: 'consultation',
      isActive: true
    }).sort({ createdAt: -1 });

    if (!consultationServiceCharge) {
      console.warn(`No active consultation service charge found for branch ${branchId}`);
      return {
        success: true,
        message: 'No consultation service charge configured for this branch'
      };
    }

    const invoiceNumber = `CONS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const consultationItem = {
      description: consultationServiceCharge.serviceName,
      quantity: 1,
      unitPrice: consultationServiceCharge.price,
      total: consultationServiceCharge.price,
      category: 'consultation' as const
    };

    const subtotal = consultationServiceCharge.price;
    const tax = 0;
    const discount = 0;
    const totalAmount = subtotal + tax - discount;
    const balance = totalAmount;

    const billingData = {
      invoiceNumber,
      patient: new mongoose.Types.ObjectId(patientId),
      visit: new mongoose.Types.ObjectId(visitId),
      branch: new mongoose.Types.ObjectId(branchId),
      items: [consultationItem],
      subtotal,
      tax,
      discount,
      totalAmount,
      amountPaid: 0,
      balance,
      status: 'pending' as const,
      paymentStatus: 'unpaid' as const,
      createdBy: new mongoose.Types.ObjectId(createdById),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: 'Consultation fee - automatically added when doctor assigned'
    };

    const billing = await Billing.create(billingData);

    const populatedBilling = await Billing.findById(billing._id)
      .populate('patient', 'patientId firstName lastName phoneNumber email')
      .populate('branch', 'name address')
      .populate('visit', 'visitNumber')
      .populate('createdBy', 'firstName lastName email');

    console.log(`Consultation fee billing created for visit ${visitId}: ${billing.invoiceNumber}`);

    return {
      success: true,
      billing: populatedBilling,
      message: 'Consultation fee added successfully'
    };

  } catch (error: any) {
    console.error('Error adding consultation fee to visit:', error);
    return {
      success: false,
      message: `Failed to add consultation fee: ${error.message}`
    };
  }
}

export async function hasConsultationFee(visitId: string): Promise<boolean> {
  try {
    const consultationBilling = await Billing.findOne({
      visit: visitId,
      'items.category': 'consultation'
    });

    return !!consultationBilling;
  } catch (error) {
    console.error('Error checking consultation fee:', error);
    return false;
  }
}
