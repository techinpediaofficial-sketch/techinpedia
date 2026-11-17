import nodemailer from 'nodemailer';

interface SendEnquiryNotificationParams {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service?: string | null;
  budget?: string | null;
  timeline?: string | null;
  message: string;
  source?: string;
  enquiryId: string;
}

export async function sendEnquiryEmailNotification(params: SendEnquiryNotificationParams): Promise<boolean> {
  try {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM || 'TechInPedia <info@techinpedia.com>';

    if (!host || !user || !pass) {
      console.log('ℹ️ SMTP credentials not fully configured in environment. Skipping email dispatch silently.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const adminUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com'}/admin/enquiries/${params.enquiryId}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb; margin-top: 0;">New Project Enquiry Received</h2>
        <p>A new client lead has been submitted via <strong>${params.source || 'Website'}</strong>.</p>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 8px; font-weight: bold; width: 120px;">Client Name:</td><td style="padding: 8px;">${params.name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;"><a href="mailto:${params.email}">${params.email}</a></td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${params.phone || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Company:</td><td style="padding: 8px;">${params.company || 'N/A'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Service:</td><td style="padding: 8px;">${params.service || 'General'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Budget:</td><td style="padding: 8px;">${params.budget || 'Unspecified'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Timeline:</td><td style="padding: 8px;">${params.timeline || 'Unspecified'}</td></tr>
        </table>

        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin-bottom: 20px;">
          <strong>Message:</strong><br />
          <p style="margin: 5px 0 0 0; white-space: pre-wrap;">${params.message}</p>
        </div>

        <a href="${adminUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold;">View Lead in Admin CRM</a>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: user, // Send to company admin email
      subject: `🚨 New Enquiry from ${params.name} [${params.service || 'General'}]`,
      html: htmlContent,
    });

    console.log('✅ Enquiry notification email dispatched successfully.');
    return true;
  } catch (error) {
    console.error('⚠️ Failed to send enquiry email notification (silently caught):', error);
    return false;
  }
}

interface SendChatAdminNotificationParams {
  sessionId: string;
  userName: string;
  userEmail: string;
  message: string;
}

export async function sendNewChatMessageAdminNotification(params: SendChatAdminNotificationParams): Promise<boolean> {
  try {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM || 'TechInPedia Live Chat <info@techinpedia.com>';

    if (!host || !user || !pass) {
      console.log('ℹ️ SMTP credentials not fully configured in environment. Skipping live chat admin email dispatch.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const adminChatUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://techinpedia.com'}/admin/chats?session=${params.sessionId}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #7c3aed; margin-top: 0;">💬 New Live Chat Message</h2>
        <p>You received a new message from <strong>${params.userName}</strong> (<a href="mailto:${params.userEmail}">${params.userEmail}</a>).</p>
        
        <div style="background-color: #faf5ff; padding: 15px; border-left: 4px solid #7c3aed; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; font-size: 15px; color: #0f172a; white-space: pre-wrap;">"${params.message}"</p>
        </div>

        <a href="${adminChatUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">Open Live Chat Inbox</a>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: user,
      subject: `💬 New Live Chat Message from ${params.userName}`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('⚠️ Failed to send chat admin email notification:', error);
    return false;
  }
}

interface SendChatUserNotificationParams {
  sessionId: string;
  userName: string;
  userEmail: string;
  message: string;
}

export async function sendChatMessageUserNotification(params: SendChatUserNotificationParams): Promise<boolean> {
  try {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASSWORD;
    const from = process.env.EMAIL_FROM || 'TechInPedia Support <info@techinpedia.com>';

    if (!host || !user || !pass) {
      console.log('ℹ️ SMTP credentials not fully configured in environment. Skipping user live chat email dispatch.');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #7c3aed; margin-top: 0;">Reply from TechInPedia Team</h2>
        <p>Hello <strong>${params.userName}</strong>,</p>
        <p>Our team responded to your live chat session:</p>
        
        <div style="background-color: #faf5ff; padding: 15px; border-left: 4px solid #7c3aed; margin-bottom: 20px; border-radius: 4px;">
          <p style="margin: 0; font-size: 15px; color: #0f172a; white-space: pre-wrap;">"${params.message}"</p>
        </div>

        <p style="font-size: 13px; color: #64748b;">You can reply to this email or return to our website to continue the live conversation.</p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">TechInPedia — Hardware, Software & Digital Marketing Solutions</p>
      </div>
    `;

    await transporter.sendMail({
      from,
      to: params.userEmail,
      subject: `Re: Live Chat with TechInPedia Team`,
      html: htmlContent,
    });

    return true;
  } catch (error) {
    console.error('⚠️ Failed to send user live chat reply email:', error);
    return false;
  }
}

