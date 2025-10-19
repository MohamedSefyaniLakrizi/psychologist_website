# Email Templates - Quick Reference

## Common Customizations

### Change Doctor Name

File: `lib/services/email-templates.ts`

```typescript
export const EMAIL_CONFIG = {
  DOCTOR_NAME: "Dr. Jean Dupont", // ← Change this
  // ... rest of config
};
```

### Change Office Address

```typescript
export const EMAIL_CONFIG = {
  OFFICE_ADDRESS: "456 Avenue des Champs, 75008 Paris", // ← Change this
  // ... rest of config
};
```

### Change Sender Email

```typescript
export const EMAIL_CONFIG = {
  FROM_EMAIL: "contact@yourpsycholog y.com", // ← Change this
  // ... rest of config
};
```

### Change Primary Color (Blue)

```typescript
export const EMAIL_CONFIG = {
  COLORS: {
    PRIMARY_BLUE: "#3b82f6", // ← Change this
    // ... rest of colors
  },
};
```

---

## Template Locations

All templates are in: `admin/lib/services/email-templates.ts`

| Template                                   | Line | Purpose                         |
| ------------------------------------------ | ---- | ------------------------------- |
| `ConfirmationEmailTemplate`                | ~150 | Single appointment confirmation |
| `RecurringSeriesConfirmationEmailTemplate` | ~190 | Multiple recurring appointments |
| `TwentyFourHourReminderEmailTemplate`      | ~260 | Day-before reminder             |
| `OneHourReminderEmailTemplate`             | ~290 | One-hour before reminder        |
| `InvoiceEmailTemplate`                     | ~330 | Invoice delivery                |
| `RescheduleNotificationEmailTemplate`      | ~360 | Reschedule notification         |
| `CancellationEmailTemplate`                | ~395 | Cancellation notice             |

---

## Add New Email Template

### Step 1: Create Template

```typescript
export const MyCustomEmailTemplate = {
  generate(appointment: Appointment, customData: any): EmailTemplate {
    return {
      subject: "Your Email Subject",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; margin-bottom: 20px;">
            Your Title
          </h2>
          <p>Bonjour ${appointment.client.firstName},</p>
          <p>Your content here</p>
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};
```

### Step 2: Add Method to EmailService

File: `lib/services/email-service.ts`

```typescript
static async sendMyCustomEmail(appointment: any) {
  try {
    const template = MyCustomEmailTemplate.generate(appointment, {});

    return await resend.emails.send({
      from: EMAIL_CONFIG.FROM_EMAIL,
      to: appointment.client.email,
      subject: template.subject,
      html: template.html,
    });
  } catch (error) {
    console.error("Error sending custom email:", error);
    throw error;
  }
}
```

### Step 3: Use in Your Code

```typescript
import { EmailService } from "@/lib/services/email-service";

await EmailService.sendMyCustomEmail(appointment);
```

---

## Styling Reference

### Colors

```typescript
EMAIL_CONFIG.COLORS.PRIMARY_BLUE; // #2563eb - Main CTA buttons
EMAIL_CONFIG.COLORS.PRIMARY_GREEN; // #16a34a - Success/in-person
EMAIL_CONFIG.COLORS.ERROR_RED; // #dc2626 - Reminders/urgent
EMAIL_CONFIG.COLORS.WARNING_ORANGE; // #f59e0b - Warnings/info
```

### Common Div Styles

**Blue Info Box:**

```html
<div
  style="background-color: #f0f9ff; border: 1px solid #0284c7; border-radius: 8px; padding: 15px; margin: 20px 0;"
>
  <p style="margin: 0; color: #0284c7;">Your content</p>
</div>
```

**Green Success Box:**

```html
<div
  style="background-color: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 15px; margin: 20px 0;"
>
  <p style="margin: 0; color: #16a34a;">Your content</p>
</div>
```

**Orange Warning Box:**

```html
<div
  style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;"
>
  <p style="margin: 0; color: #92400e;">Your content</p>
</div>
```

---

## Testing

### Test Email Template Rendering

```bash
# In your browser console or local testing:
cd admin
npm run dev

# Visit email preview in Resend dashboard
```

### Preview Before Sending

Resend automatically previews emails before they're sent. Check the response in console.

---

## File References

| File                              | Purpose                     | Edit For                              |
| --------------------------------- | --------------------------- | ------------------------------------- |
| `lib/services/email-templates.ts` | All template definitions    | Email content, styling, branding      |
| `lib/services/email-service.ts`   | Send emails using templates | Email sending logic, new send methods |
| `lib/services/email-scheduler.ts` | Schedule emails             | Email timing, when emails are sent    |
| `lib/actions/appointments.ts`     | Use email service           | Calling email methods                 |

---

## Common Issues

### Email not sending?

1. Check `EMAIL_CONFIG.FROM_EMAIL` is correct
2. Verify Resend API key in `.env`
3. Check appointment has `client.email`

### Styling looks wrong?

1. Ensure inline styles (not CSS classes)
2. Use `${EMAIL_CONFIG.COLORS...}` for colors
3. Test in multiple email clients

### Need to add a field to emails?

1. Update `Appointment` interface in templates file
2. Use the field in template HTML
3. Ensure data is passed from the calling function

---

## Before Deploying

- [ ] Update `EMAIL_CONFIG` with correct doctor name
- [ ] Update `OFFICE_ADDRESS`
- [ ] Update `FROM_EMAIL`
- [ ] Test all email templates
- [ ] Verify colors match brand
- [ ] Test appointment confirmation email
- [ ] Test reminder emails
- [ ] Test on mobile and desktop email clients
