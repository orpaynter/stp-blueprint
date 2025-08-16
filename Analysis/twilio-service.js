const twilio = require('twilio');

/**
 * Twilio Integration Service for OrPaynter
 * Provides SMS, voice, and notification capabilities
 */
class TwilioService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Send SMS message
   * @param {string} to - Recipient phone number
   * @param {string} body - Message body
   * @returns {Promise<Object>} Message details
   */
  async sendSMS(to, body) {
    try {
      const message = await this.client.messages.create({
        body,
        from: this.phoneNumber,
        to
      });
      
      return {
        id: message.sid,
        status: message.status,
        body: message.body,
        to: message.to,
        from: message.from,
        dateCreated: message.dateCreated
      };
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send bulk SMS messages
   * @param {Array} recipients - Array of recipient phone numbers
   * @param {string} body - Message body
   * @returns {Promise<Array>} Array of message details
   */
  async sendBulkSMS(recipients, body) {
    try {
      const messages = await Promise.all(
        recipients.map(recipient => this.sendSMS(recipient, body))
      );
      
      return messages;
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      throw new Error(`Failed to send bulk SMS: ${error.message}`);
    }
  }

  /**
   * Make a voice call
   * @param {string} to - Recipient phone number
   * @param {string} twimlUrl - URL to TwiML instructions
   * @returns {Promise<Object>} Call details
   */
  async makeCall(to, twimlUrl) {
    try {
      const call = await this.client.calls.create({
        url: twimlUrl,
        from: this.phoneNumber,
        to
      });
      
      return {
        id: call.sid,
        status: call.status,
        to: call.to,
        from: call.from,
        dateCreated: call.dateCreated
      };
    } catch (error) {
      console.error('Error making call:', error);
      throw new Error(`Failed to make call: ${error.message}`);
    }
  }

  /**
   * Generate TwiML for voice messages
   * @param {string} message - Voice message
   * @param {Object} options - Additional options
   * @returns {string} TwiML markup
   */
  generateVoiceTwiML(message, options = {}) {
    const { voice = 'alice', language = 'en-US', loop = 1 } = options;
    
    return `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="${voice}" language="${language}" loop="${loop}">${message}</Say>
      </Response>
    `;
  }

  /**
   * Send appointment reminder
   * @param {Object} appointment - Appointment details
   * @returns {Promise<Object>} Message details
   */
  async sendAppointmentReminder(appointment) {
    const { phone, name, date, time, address, type } = appointment;
    
    const message = `
      Hello ${name}, this is a reminder about your upcoming ${type} appointment with Oliver's Roofing and Contracting.
      Date: ${date}
      Time: ${time}
      Address: ${address}
      Reply Y to confirm or call (555) 123-4567 to reschedule.
    `;
    
    return await this.sendSMS(phone, message);
  }

  /**
   * Send project update notification
   * @param {Object} project - Project details
   * @param {string} update - Update message
   * @returns {Promise<Object>} Message details
   */
  async sendProjectUpdate(project, update) {
    const { customerPhone, customerName, projectId, projectAddress } = project;
    
    const message = `
      Hello ${customerName}, update on your roofing project #${projectId} at ${projectAddress}:
      ${update}
      View details in the OrPaynter app or reply with any questions.
    `;
    
    return await this.sendSMS(customerPhone, message);
  }

  /**
   * Send weather alert for scheduled projects
   * @param {Object} project - Project details
   * @param {Object} weather - Weather alert details
   * @returns {Promise<Object>} Message details
   */
  async sendWeatherAlert(project, weather) {
    const { customerPhone, customerName, projectId, projectAddress, scheduledDate } = project;
    const { condition, description } = weather;
    
    const message = `
      WEATHER ALERT: ${customerName}, your roofing project #${projectId} at ${projectAddress} scheduled for ${scheduledDate} may be affected by ${condition}.
      ${description}
      We'll contact you soon to discuss rescheduling options.
    `;
    
    return await this.sendSMS(customerPhone, message);
  }

  /**
   * Send payment confirmation
   * @param {Object} payment - Payment details
   * @returns {Promise<Object>} Message details
   */
  async sendPaymentConfirmation(payment) {
    const { customerPhone, customerName, amount, invoiceId, date } = payment;
    
    const message = `
      Thank you, ${customerName}! Your payment of $${amount} for invoice #${invoiceId} was received on ${date}.
      A receipt has been emailed to you. Thank you for choosing Oliver's Roofing and Contracting!
    `;
    
    return await this.sendSMS(customerPhone, message);
  }

  /**
   * Send estimate notification
   * @param {Object} estimate - Estimate details
   * @returns {Promise<Object>} Message details
   */
  async sendEstimateNotification(estimate) {
    const { customerPhone, customerName, estimateId, amount, validUntil } = estimate;
    
    const message = `
      Hello ${customerName}, your roofing estimate #${estimateId} for $${amount} is ready to view in the OrPaynter app.
      This estimate is valid until ${validUntil}.
      Questions? Reply to this message or call (555) 123-4567.
    `;
    
    return await this.sendSMS(customerPhone, message);
  }

  /**
   * Send verification code
   * @param {string} phone - Phone number
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Message details
   */
  async sendVerificationCode(phone, code) {
    const message = `
      Your OrPaynter verification code is: ${code}
      This code will expire in 10 minutes.
    `;
    
    return await this.sendSMS(phone, message);
  }

  /**
   * Check message status
   * @param {string} messageId - Message ID
   * @returns {Promise<Object>} Message status
   */
  async checkMessageStatus(messageId) {
    try {
      const message = await this.client.messages(messageId).fetch();
      
      return {
        id: message.sid,
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        dateUpdated: message.dateUpdated
      };
    } catch (error) {
      console.error('Error checking message status:', error);
      throw new Error(`Failed to check message status: ${error.message}`);
    }
  }

  /**
   * Check call status
   * @param {string} callId - Call ID
   * @returns {Promise<Object>} Call status
   */
  async checkCallStatus(callId) {
    try {
      const call = await this.client.calls(callId).fetch();
      
      return {
        id: call.sid,
        status: call.status,
        direction: call.direction,
        duration: call.duration,
        price: call.price,
        dateCreated: call.dateCreated,
        dateUpdated: call.dateUpdated
      };
    } catch (error) {
      console.error('Error checking call status:', error);
      throw new Error(`Failed to check call status: ${error.message}`);
    }
  }
}

module.exports = new TwilioService();
