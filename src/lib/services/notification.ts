import Patient from '@/models/Patient';
import User from '@/models/User';
import { IAppointment } from '@/models/Appointment';

export interface NotificationPayload {
  recipient: string;
  subject: string;
  message: string;
  type: 'email' | 'sms' | 'push';
}

export async function sendAppointmentNotification(
  appointment: IAppointment,
  notificationType: 'created' | 'updated' | 'cancelled' | 'status_changed'
): Promise<void> {
  try {
    const patient = await Patient.findById(appointment.patientId);
    const doctor = await User.findById(appointment.doctorId);

    if (!patient || !doctor) {
      console.warn('Could not send notification: Patient or Doctor not found');
      return;
    }

    const appointmentDate = new Date(appointment.appointmentDate).toLocaleDateString();
    const appointmentTime = appointment.appointmentTime;

    let patientMessage = '';
    let doctorMessage = '';
    let subject = '';

    switch (notificationType) {
      case 'created':
        subject = 'New Appointment Scheduled';
        patientMessage = `Dear ${patient.getFullName()},\n\nYour appointment with Dr. ${doctor.getFullName()} has been scheduled for ${appointmentDate} at ${appointmentTime}.\n\nAppointment Number: ${appointment.appointmentNumber}\nReason: ${appointment.reasonForVisit}\n\nThank you!`;
        doctorMessage = `New appointment scheduled:\n\nPatient: ${patient.getFullName()}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nAppointment Number: ${appointment.appointmentNumber}\nReason: ${appointment.reasonForVisit}`;
        break;

      case 'updated':
        subject = 'Appointment Updated';
        patientMessage = `Dear ${patient.getFullName()},\n\nYour appointment (${appointment.appointmentNumber}) with Dr. ${doctor.getFullName()} has been updated.\n\nNew Date: ${appointmentDate}\nNew Time: ${appointmentTime}\n\nThank you!`;
        doctorMessage = `Appointment updated:\n\nPatient: ${patient.getFullName()}\nNew Date: ${appointmentDate}\nNew Time: ${appointmentTime}\nAppointment Number: ${appointment.appointmentNumber}`;
        break;

      case 'cancelled':
        subject = 'Appointment Cancelled';
        patientMessage = `Dear ${patient.getFullName()},\n\nYour appointment (${appointment.appointmentNumber}) scheduled for ${appointmentDate} at ${appointmentTime} has been cancelled.\n\nReason: ${appointment.cancelReason || 'Not specified'}\n\nPlease contact us to reschedule.`;
        doctorMessage = `Appointment cancelled:\n\nPatient: ${patient.getFullName()}\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nAppointment Number: ${appointment.appointmentNumber}`;
        break;

      case 'status_changed':
        subject = `Appointment Status Changed to ${appointment.status}`;
        patientMessage = `Dear ${patient.getFullName()},\n\nYour appointment status has been updated to: ${appointment.status}\n\nAppointment Number: ${appointment.appointmentNumber}\nDate: ${appointmentDate}\nTime: ${appointmentTime}`;
        doctorMessage = `Appointment status changed to ${appointment.status}:\n\nPatient: ${patient.getFullName()}\nAppointment Number: ${appointment.appointmentNumber}`;
        break;
    }

    console.log('📧 Notification sent:', {
      type: notificationType,
      subject,
      patientEmail: patient.email || patient.phone,
      doctorEmail: doctor.email,
      appointmentNumber: appointment.appointmentNumber,
      patientMessage,
      doctorMessage
    });

  } catch (error) {
    console.error('Failed to send appointment notification:', error);
  }
}

export async function sendBulkNotifications(
  notifications: NotificationPayload[]
): Promise<void> {
  console.log(`📧 Sending ${notifications.length} notifications...`);
  
  for (const notification of notifications) {
    console.log('Notification:', {
      recipient: notification.recipient,
      subject: notification.subject,
      type: notification.type
    });
  }
}

export async function createInAppNotification(data: {
  recipientId: string;
  branchId: string;
  title: string;
  message: string;
  type?: 'info' | 'warning' | 'success' | 'error' | 'clock_out' | 'appointment' | 'message';
  relatedModel?: 'Patient' | 'PatientVisit' | 'Appointment' | 'Billing' | 'Message';
  relatedId?: string;
  actionUrl?: string;
  senderId?: string;
}): Promise<void> {
  try {
    const Notification = (await import('@/models/Notification')).default;
    
    await Notification.create({
      recipient: data.recipientId,
      sender: data.senderId,
      branchId: data.branchId,
      title: data.title,
      message: data.message,
      type: data.type || 'info',
      relatedModel: data.relatedModel,
      relatedId: data.relatedId,
      actionUrl: data.actionUrl,
      isRead: false
    });
    
    console.log(`✅ In-app notification created for user ${data.recipientId}`);
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
  }
}
