const sgMail = require('@sendgrid/mail');
const sgClient = require('@sendgrid/client');

/**
 * SendGrid Integration Service for OrPaynter
 * Provides email communication capabilities
 */
class SendGridService {
  constructor() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgClient.setApiKey(process.env.SENDGRID_API_KEY);
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'notifications@oliversroofingandcontracting.com';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Oliver\'s Roofing and Contracting';
  }

  /**
   * Send a single email
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Response data
   */
  async sendEmail(emailData) {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html || this._convertTextToHtml(emailData.text)
      };
      
      // Add optional parameters if provided
      if (emailData.cc) msg.cc = emailData.cc;
      if (emailData.bcc) msg.bcc = emailData.bcc;
      if (emailData.replyTo) msg.replyTo = emailData.replyTo;
      if (emailData.attachments) msg.attachments = emailData.attachments;
      if (emailData.templateId) {
        msg.templateId = emailData.templateId;
        msg.dynamicTemplateData = emailData.dynamicTemplateData || {};
      }
      
      const response = await sgMail.send(msg);
      
      return {
        statusCode: response[0].statusCode,
        headers: response[0].headers,
        success: response[0].statusCode >= 200 && response[0].statusCode < 300
      };
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send multiple emails
   * @param {Array} emailsData - Array of email data
   * @returns {Promise<Array>} Array of response data
   */
  async sendBulkEmails(emailsData) {
    try {
      const messages = emailsData.map(emailData => ({
        to: emailData.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html || this._convertTextToHtml(emailData.text),
        ...(emailData.cc && { cc: emailData.cc }),
        ...(emailData.bcc && { bcc: emailData.bcc }),
        ...(emailData.replyTo && { replyTo: emailData.replyTo }),
        ...(emailData.attachments && { attachments: emailData.attachments }),
        ...(emailData.templateId && { 
          templateId: emailData.templateId,
          dynamicTemplateData: emailData.dynamicTemplateData || {}
        })
      }));
      
      const response = await sgMail.send(messages);
      
      return {
        statusCode: response[0].statusCode,
        headers: response[0].headers,
        success: response[0].statusCode >= 200 && response[0].statusCode < 300
      };
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      throw new Error(`Failed to send bulk emails: ${error.message}`);
    }
  }

  /**
   * Create a contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} Contact data
   */
  async createContact(contactData) {
    try {
      const data = {
        contacts: [
          {
            email: contactData.email,
            first_name: contactData.firstName,
            last_name: contactData.lastName,
            phone_number: contactData.phone,
            address_line_1: contactData.address1,
            address_line_2: contactData.address2,
            city: contactData.city,
            state_province_region: contactData.state,
            postal_code: contactData.postalCode,
            country: contactData.country,
            custom_fields: contactData.customFields
          }
        ]
      };
      
      const request = {
        url: '/v3/marketing/contacts',
        method: 'PUT',
        body: data
      };
      
      const [response] = await sgClient.request(request);
      
      return {
        statusCode: response.statusCode,
        body: response.body,
        success: response.statusCode >= 200 && response.statusCode < 300
      };
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }

  /**
   * Add contact to a list
   * @param {string} email - Contact email
   * @param {string} listId - List ID
   * @returns {Promise<Object>} Response data
   */
  async addContactToList(email, listId) {
    try {
      const data = {
        list_ids: [listId],
        contacts: [
          {
            email
          }
        ]
      };
      
      const request = {
        url: '/v3/marketing/contacts',
        method: 'PUT',
        body: data
      };
      
      const [response] = await sgClient.request(request);
      
      return {
        statusCode: response.statusCode,
        body: response.body,
        success: response.statusCode >= 200 && response.statusCode < 300
      };
    } catch (error) {
      console.error('Error adding contact to list:', error);
      throw new Error(`Failed to add contact to list: ${error.message}`);
    }
  }

  /**
   * Create an email template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Template data
   */
  async createTemplate(templateData) {
    try {
      const data = {
        name: templateData.name,
        generation: 'dynamic',
        subject: templateData.subject,
        html_content: templateData.htmlContent
      };
      
      const request = {
        url: '/v3/templates',
        method: 'POST',
        body: data
      };
      
      const [response] = await sgClient.request(request);
      
      return {
        statusCode: response.statusCode,
        body: response.body,
        success: response.statusCode >= 200 && response.statusCode < 300
      };
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error(`Failed to create template: ${error.message}`);
    }
  }

  /**
   * Send welcome email
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Response data
   */
  async sendWelcomeEmail(userData) {
    const emailData = {
      to: userData.email,
      subject: `Welcome to OrPaynter, ${userData.firstName}!`,
      text: `
        Hello ${userData.firstName},
        
        Welcome to OrPaynter, the AI-powered platform for roofing contractors and homeowners!
        
        Your account has been successfully created. Here's what you can do next:
        
        1. Complete your profile
        2. Explore the dashboard
        3. Schedule your first assessment
        
        If you have any questions, please don't hesitate to contact our support team at support@oliversroofingandcontracting.com or call us at (555) 123-4567.
        
        Best regards,
        The OrPaynter Team
      `,
      templateId: process.env.SENDGRID_WELCOME_TEMPLATE_ID,
      dynamicTemplateData: {
        first_name: userData.firstName,
        user_type: userData.userType,
        login_url: 'https://app.oliversroofingandcontracting.com/login'
      }
    };
    
    return await this.sendEmail(emailData);
  }

  /**
   * Send password reset email
   * @param {Object} userData - User data
   * @param {string} resetToken - Reset token
   * @returns {Promise<Object>} Response data
   */
  async sendPasswordResetEmail(userData, resetToken) {
    const resetUrl = `https://app.oliversroofingandcontracting.com/reset-password?token=${resetToken}`;
    
    const emailData = {
      to: userData.email,
      subject: 'Reset Your OrPaynter Password',
      text: `
        Hello ${userData.firstName},
        
        We received a request to reset your password for your OrPaynter account.
        
        To reset your password, please click on the link below:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you did not request a password reset, please ignore this email or contact our support team at support@oliversroofingandcontracting.com.
        
        Best regards,
        The OrPaynter Team
      `,
      templateId: process.env.SENDGRID_PASSWORD_RESET_TEMPLATE_ID,
      dynamicTemplateData: {
        first_name: userData.firstName,
        reset_url: resetUrl
      }
    };
    
    return await this.sendEmail(emailData);
  }

  /**
   * Send project update email
   * @param {Object} projectData - Project data
   * @param {string} updateMessage - Update message
   * @returns {Promise<Object>} Response data
   */
  async sendProjectUpdateEmail(projectData, updateMessage) {
    const emailData = {
      to: projectData.customerEmail,
      subject: `Update on Your Roofing Project #${projectData.projectId}`,
      text: `
        Hello ${projectData.customerName},
        
        We have an update on your roofing project at ${projectData.projectAddress}:
        
        ${updateMessage}
        
        You can view more details and track the progress of your project by logging into your OrPaynter account.
        
        If you have any questions, please contact your project manager, ${projectData.projectManagerName}, at ${projectData.projectManagerPhone}.
        
        Best regards,
        The OrPaynter Team
      `,
      templateId: process.env.SENDGRID_PROJECT_UPDATE_TEMPLATE_ID,
      dynamicTemplateData: {
        customer_name: projectData.customerName,
        project_id: projectData.projectId,
        project_address: projectData.projectAddress,
        update_message: updateMessage,
        project_manager_name: projectData.projectManagerName,
        project_manager_phone: projectData.projectManagerPhone,
        project_url: `https://app.oliversroofingandcontracting.com/projects/${projectData.projectId}`
      }
    };
    
    return await this.sendEmail(emailData);
  }

  /**
   * Send invoice email
   * @param {Object} invoiceData - Invoice data
   * @param {string} pdfAttachment - Base64 encoded PDF attachment
   * @returns {Promise<Object>} Response data
   */
  async sendInvoiceEmail(invoiceData, pdfAttachment) {
    const emailData = {
      to: invoiceData.customerEmail,
      subject: `Invoice #${invoiceData.invoiceNumber} for Your Roofing Project`,
      text: `
        Hello ${invoiceData.customerName},
        
        Please find attached your invoice #${invoiceData.invoiceNumber} for your roofing project at ${invoiceData.projectAddress}.
        
        Invoice Details:
        - Invoice Number: ${invoiceData.invoiceNumber}
        - Invoice Date: ${invoiceData.invoiceDate}
        - Due Date: ${invoiceData.dueDate}
        - Amount Due: $${invoiceData.amountDue}
        
        You can pay this invoice online by logging into your OrPaynter account or by clicking the payment link below:
        https://app.oliversroofingandcontracting.com/invoices/${invoiceData.invoiceId}/pay
        
        If you have any questions about this invoice, please contact our billing department at billing@oliversroofingandcontracting.com or call us at (555) 123-4567.
        
        Thank you for choosing Oliver's Roofing and Contracting!
        
        Best regards,
        The OrPaynter Team
      `,
      templateId: process.env.SENDGRID_INVOICE_TEMPLATE_ID,
      dynamicTemplateData: {
        customer_name: invoiceData.customerName,
        invoice_number: invoiceData.invoiceNumber,
        invoice_date: invoiceData.invoiceDate,
        due_date: invoiceData.dueDate,
        amount_due: invoiceData.amountDue,
        project_address: invoiceData.projectAddress,
        payment_url: `https://app.oliversroofingandcontracting.com/invoices/${invoiceData.invoiceId}/pay`
      },
      attachments: [
        {
          content: pdfAttachment,
          filename: `Invoice_${invoiceData.invoiceNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    };
    
    return await this.sendEmail(emailData);
  }

  /**
   * Send estimate email
   * @param {Object} estimateData - Estimate data
   * @param {string} pdfAttachment - Base64 encoded PDF attachment
   * @returns {Promise<Object>} Response data
   */
  async sendEstimateEmail(estimateData, pdfAttachment) {
    const emailData = {
      to: estimateData.customerEmail,
      subject: `Your Roofing Estimate #${estimateData.estimateNumber}`,
      text: `
        Hello ${estimateData.customerName},
        
        Thank you for choosing Oliver's Roofing and Contracting. Please find attached your roofing estimate #${estimateData.estimateNumber} for your property at ${estimateData.propertyAddress}.
        
        Estimate Details:
        - Estimate Number: ${estimateData.estimateNumber}
        - Estimate Date: ${estimateData.estimateDate}
        - Valid Until: ${estimateData.validUntil}
        - Total Amount: $${estimateData.totalAmount}
        
        You can review and approve this estimate online by logging into your OrPaynter account or by clicking the link below:
        https://app.oliversroofingandcontracting.com/estimates/${estimateData.estimateId}/review
        
        If you have any questions or would like to discuss this estimate further, please contact your estimator, ${estimateData.estimatorName}, at ${estimateData.estimatorPhone}.
        
        We look forward to working with you!
        
        Best regards,
        The OrPaynter Team
      `,
      templateId: process.env.SENDGRID_ESTIMATE_TEMPLATE_ID,
      dynamicTemplateData: {
        customer_name: estimateData.customerName,
        estimate_number: estimateData.estimateNumber,
        estimate_date: estimateData.estimateDate,
        valid_until: estimateData.validUntil,
        total_amount: estimateData.totalAmount,
        property_address: estimateData.propertyAddress,
        estimator_name: estimateData.estimatorName,
        estimator_phone: estimateData.estimatorPhone,
        review_url: `https://app.oliversroofingandcontracting.com/estimates/${estimateData.estimateId}/review`
      },
      attachments: [
        {
          content: pdfAttachment,
          filename: `Estimate_${estimateData.estimateNumber}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }
      ]
    };
    
    return await this.sendEmail(emailData);
  }

  /**
   * Send appointment confirmation email
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Response data
   */
  async sendAppointmentConfirmationEmail(appointmentData) {
    const emailData = {
      to: appointmentData.customerEmail,
      subject: `Appointment Confirmation: ${appointmentData.appointmentType} on ${appointmentData.appointmentDate}`,
      text: `
        Hello ${appointmentData.customerName},
        
        This email confirms your ${appointmentData.appointmentType} appointment with Oliver's Roofing and Contracting.
        
        Appointment Details:
        - Date: ${appointmentData.appointmentDate}
        - Time: ${appointmentData.appointmentTime}
        - Location: ${appointmentData.appointmentLocation}
        - Type: ${appointmentData.appointmentType}
        
        What to Expect:
        ${appointmentData.appointmentDescription}
        
        You can reschedule or cancel this appointment up to 24 hours in advance by logging into your OrPaynter account or by calling us at (555) 123-4567.
        
        We look forward to meeting with you!
        
        Best regards,
        The OrPaynter Team
      `,
      templateId: process.env.SENDGRID_APPOINTMENT_TEMPLATE_ID,
      dynamicTemplateData: {
        customer_name: appointmentData.customerName,
        appointment_type: appointmentData.appointmentType,
        appointment_date: appointmentData.appointmentDate,
        appointm
(Content truncated due to size limit. Use line ranges to read in chunks)