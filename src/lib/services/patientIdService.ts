import PatientCounter from '@/models/PatientCounter';
import mongoose from 'mongoose';

export async function generatePatientId(
  branchId: string | mongoose.Types.ObjectId,
  date?: Date
): Promise<string> {
  const currentDate = date || new Date();
  
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  
  const dateString = `${year}-${month}-${day}`;
  
  const counter = await PatientCounter.findOneAndUpdate(
    {
      date: dateString,
      branchId: branchId
    },
    {
      $inc: { counter: 1 }
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );

  const sequenceNumber = String(counter.counter).padStart(3, '0');
  
  const patientId = `LP/${year}/${month}/${day}/${sequenceNumber}`;
  
  return patientId;
}

export async function peekNextPatientId(
  branchId: string | mongoose.Types.ObjectId,
  date?: Date
): Promise<{ nextPatientId: string; sequence: number }> {
  const currentDate = date || new Date();
  
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
  const day = String(currentDate.getDate()).padStart(2, '0');
  const yearShort = String(year).slice(-2);
  
  const dateString = `${year}-${month}-${day}`;
  
  const counter = await PatientCounter.findOne({
    date: dateString,
    branchId: branchId
  });

  const nextSequence = counter ? counter.counter + 1 : 1;
  const sequenceNumber = String(nextSequence).padStart(3, '0');
  
  const patientId = `LP/${yearShort}/${month}/${day}/${sequenceNumber}`;
  
  return { nextPatientId: patientId, sequence: nextSequence };
}
