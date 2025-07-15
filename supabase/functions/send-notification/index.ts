import { corsHeaders } from '../_shared/cors.ts'

interface NotificationRequest {
  to: string
  subject: string
  message: string
  type?: 'analysis' | 'report' | 'general'
}

// Simple email template
function createEmailTemplate(subject: string, message: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
    .footer { text-align: center; margin-top: 20px; padding: 20px; color: #6b7280; font-size: 12px; }
    .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .message { white-space: pre-line; margin: 20px 0; }
    .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">👁️ VisionAid</div>
    <div>AI-Powered Cataract Detection</div>
  </div>
  <div class="content">
    <h2>${subject}</h2>
    <div class="message">${message}</div>
    <a href="https://visionaid.app" class="button">Open VisionAid</a>
  </div>
  <div class="footer">
    <p>This email was sent by VisionAid Cataract Detection System.</p>
    <p>If you no longer wish to receive these notifications, please update your settings in the application.</p>
  </div>
</body>
</html>
  `.trim()
}

// Simulate email sending (in production, you'd use a real email service)
async function sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
  // In a real implementation, you would integrate with:
  // - SendGrid
  // - AWS SES
  // - Mailgun
  // - Resend
  // - etc.
  
  console.log('📧 Email Notification Sent:')
  console.log(`To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log('Content:', htmlContent.substring(0, 200) + '...')
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // For demo purposes, we'll just log the email
  // In production, replace this with actual email service integration
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    const { to, subject, message, type }: NotificationRequest = await req.json()

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, message' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // Create HTML email content
    const htmlContent = createEmailTemplate(subject, message)

    // Send the email
    await sendEmail(to, subject, htmlContent)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notification sent successfully',
        type: type || 'general'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Notification error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send notification',
        message: error.message
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})