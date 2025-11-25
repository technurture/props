import mongoose from 'mongoose';
import crypto from 'crypto';
import Invoice, { InvoiceStatus, IInvoiceItem } from '@/models/Invoice';
import PatientVisit from '@/models/PatientVisit';
import Prescription from '@/models/Prescription';
import LabTest from '@/models/LabTest';
import Pharmacy from '@/models/Pharmacy';
import Patient from '@/models/Patient';
import ServiceCharge from '@/models/ServiceCharge';

interface ServicePricing {
  consultation: number;
  labTestBase: number;
  pharmacyMarkup: number;
}

const DEFAULT_PRICING: ServicePricing = {
  consultation: 5000,
  labTestBase: 3000,
  pharmacyMarkup: 1.2
};

/**
 * Fetch service charges from database for a specific branch
 * Falls back to default pricing if no charges are configured
 */
async function getServicePricing(branchId: string): Promise<ServicePricing> {
  try {
    const serviceCharges = await ServiceCharge.find({
      branch: branchId,
      isActive: true
    });

    const pricing: ServicePricing = { ...DEFAULT_PRICING };

    for (const charge of serviceCharges) {
      switch (charge.category) {
        case 'consultation':
          if (charge.serviceName.toLowerCase().includes('consultation')) {
            pricing.consultation = charge.price;
          }
          break;
        case 'laboratory':
          if (charge.serviceName.toLowerCase().includes('base') || 
              charge.serviceName.toLowerCase().includes('standard')) {
            pricing.labTestBase = charge.price;
          }
          break;
        case 'pharmacy':
          if (charge.serviceName.toLowerCase().includes('markup')) {
            pricing.pharmacyMarkup = charge.price;
          }
          break;
      }
    }

    return pricing;
  } catch (error) {
    console.error('Error fetching service pricing, using defaults:', error);
    return DEFAULT_PRICING;
  }
}

/**
 * Get price for a specific service by name and category
 */
async function getServicePrice(branchId: string, category: string, serviceName: string): Promise<number | null> {
  try {
    const serviceCharge = await ServiceCharge.findOne({
      branch: branchId,
      category,
      serviceName: { $regex: new RegExp(serviceName, 'i') },
      isActive: true
    });

    return serviceCharge?.price || null;
  } catch (error) {
    console.error('Error fetching service price:', error);
    return null;
  }
}

export async function generateInvoiceFromVisit(
  visitId: string,
  generatedBy: string,
  pricing: Partial<ServicePricing> = {}
): Promise<any> {
  const visit = await PatientVisit.findById(visitId)
    .populate('patient')
    .populate('branchId');

  if (!visit) {
    throw new Error('Visit not found');
  }

  if (visit.status === 'cancelled') {
    throw new Error('Cannot generate invoice for cancelled visit');
  }

  const patient = await Patient.findById(visit.patient);
  if (!patient) {
    throw new Error('Patient not found');
  }

  const branchId = typeof visit.branchId === 'string' ? visit.branchId : visit.branchId._id.toString();
  
  const servicePricing = await getServicePricing(branchId);
  const finalPricing = { ...servicePricing, ...pricing };

  const items: IInvoiceItem[] = [];

  if (visit.stages?.doctor?.clockedInAt) {
    const consultationPrice = await getServicePrice(branchId, 'consultation', 'consultation') || finalPricing.consultation;
    
    items.push({
      description: 'Consultation Fee',
      quantity: 1,
      unitPrice: consultationPrice,
      total: consultationPrice
    });
  }

  const prescriptions = await Prescription.find({ visit: visitId });
  for (const prescription of prescriptions) {
    for (const med of prescription.medications) {
      const pharmacyItem = await Pharmacy.findOne({
        productName: { $regex: new RegExp(med.name, 'i') }
      });
      
      const unitPrice = pharmacyItem?.price || 1000;
      const quantity = med.quantity || 1;
      const total = unitPrice * quantity * finalPricing.pharmacyMarkup;

      items.push({
        description: `${med.name} - ${med.dosage} (${med.duration})`,
        quantity,
        unitPrice: Math.round(unitPrice * finalPricing.pharmacyMarkup),
        total: Math.round(total)
      });
    }
  }

  const labTests = await LabTest.find({ visit: visitId }).populate('serviceCharge');
  for (const labTest of labTests) {
    let labTestPrice = finalPricing.labTestBase;
    
    // First, try to get price from the linked ServiceCharge
    if (labTest.serviceCharge && typeof labTest.serviceCharge === 'object' && 'price' in labTest.serviceCharge) {
      labTestPrice = labTest.serviceCharge.price;
    } else {
      // Fallback to searching by name or category
      labTestPrice = await getServicePrice(branchId, 'laboratory', labTest.testName) || 
                     await getServicePrice(branchId, 'laboratory', labTest.testCategory) ||
                     finalPricing.labTestBase;
    }
    
    items.push({
      description: `Lab Test: ${labTest.testName}`,
      quantity: 1,
      unitPrice: labTestPrice,
      total: labTestPrice
    });
  }

  if (items.length === 0) {
    throw new Error('No billable items found for this visit');
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const tax = Math.round(subtotal * 0.075);
  const discount = 0;
  const grandTotal = subtotal + tax - discount;

  let insuranceClaim = undefined;
  if (patient.insurance && patient.insurance.provider) {
    const insuranceDeduction = Math.round(grandTotal * 0.3);
    insuranceClaim = {
      provider: patient.insurance.provider,
      claimNumber: `CLM-${Date.now()}`,
      claimAmount: insuranceDeduction,
      status: 'PENDING'
    };
  }

  const timestamp = Date.now().toString();
  const randomSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  const invoiceNumber = `INV-${timestamp}-${randomSuffix}`;

  const invoiceData = {
    invoiceNumber,
    patientId: visit.patient,
    encounterId: visitId,
    branchId: visit.branchId,
    items,
    subtotal,
    tax,
    discount,
    grandTotal,
    status: InvoiceStatus.PENDING,
    paidAmount: 0,
    balance: grandTotal,
    insuranceClaim,
    generatedBy: new mongoose.Types.ObjectId(generatedBy)
  };

  const invoice = await Invoice.findOneAndUpdate(
    { encounterId: visitId },
    { $setOnInsert: invoiceData },
    { 
      upsert: true, 
      new: true,
      setDefaultsOnInsert: true
    }
  );

  const populatedInvoice = await Invoice.findById(invoice._id)
    .populate('patientId', 'patientId firstName lastName phoneNumber email insurance')
    .populate('branchId', 'name address city state')
    .populate('generatedBy', 'firstName lastName email');

  return populatedInvoice;
}

export async function checkExistingInvoice(visitId: string): Promise<any | null> {
  const invoice = await Invoice.findOne({ encounterId: visitId })
    .populate('patientId', 'patientId firstName lastName phoneNumber email insurance')
    .populate('branchId', 'name address city state')
    .populate('generatedBy', 'firstName lastName email');
  
  return invoice;
}

export async function updateInvoicePayment(
  invoiceId: string,
  paymentAmount: number,
  paymentMethod: string
): Promise<any> {
  const invoice = await Invoice.findById(invoiceId);
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (invoice.status === InvoiceStatus.CANCELLED) {
    throw new Error('Cannot update payment for cancelled invoice');
  }

  const newPaidAmount = invoice.paidAmount + paymentAmount;
  const newBalance = invoice.grandTotal - newPaidAmount;

  let newStatus = invoice.status;
  if (newBalance === 0) {
    newStatus = InvoiceStatus.PAID;
  } else if (newPaidAmount > 0 && newBalance > 0) {
    newStatus = InvoiceStatus.PARTIALLY_PAID;
  }

  invoice.paidAmount = newPaidAmount;
  invoice.balance = newBalance;
  invoice.status = newStatus;
  invoice.paymentMethod = paymentMethod;

  await invoice.save();

  const updatedInvoice = await Invoice.findById(invoiceId)
    .populate('patientId', 'patientId firstName lastName phoneNumber email insurance')
    .populate('branchId', 'name address city state')
    .populate('generatedBy', 'firstName lastName email');

  return updatedInvoice;
}
