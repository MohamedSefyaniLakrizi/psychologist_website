# Email Templates System - Documentation

## Overview

All email templates have been consolidated into a single centralized file: `lib/services/email-templates.ts`

This makes it easy to:

- 📝 Edit email templates in one place
- 🎨 Maintain consistent styling across all emails
- 🔧 Customize branding and configuration
- 📧 Add new email templates
- 🚀 Reuse email components

## Architecture

### Files Structure

```
lib/services/
├── email-templates.ts      ← All email templates (NEW - centralized)
├── email-service.ts        ← Email sending service (refactored to use templates)
└── email-scheduler.ts      ← Email scheduling (no changes needed)
```

## How to Customize Emails

### 1. Change Branding/Configuration

Edit `EMAIL_CONFIG` at the top of `email-templates.ts`:

```typescript
export const EMAIL_CONFIG = {
  FROM_EMAIL: "Malika Lkhabir <onboarding@resend.dev>", // Change sender
  DOCTOR_NAME: "Dr. Malika Lkhabir", // Change doctor name
  DOCTOR_TITLE: "Psychologue clinicienne", // Change title
  OFFICE_NAME: "Cabinet Dr. Malika Lkhabir", // Change office name
  OFFICE_ADDRESS: "123 Rue de la Santé, 75014 Paris", // Change address
  COLORS: {
    PRIMARY_BLUE: "#2563eb", // Change primary color
    PRIMARY_GREEN: "#16a34a", // Change success color
    ERROR_RED: "#dc2626", // Change error color
    // ... more colors
  },
};
```

### 2. Edit an Existing Email Template

Find the template in `email-templates.ts` and modify it:

```typescript
export const ConfirmationEmailTemplate = {
  generate(appointment: Appointment): EmailTemplate {
    // Edit the HTML here
    return {
      subject: "Your custom subject",
      html: `<div>Your custom HTML</div>`,
    };
  },
};
```

### 3. Add a New Email Template

Create a new template following the pattern:

```typescript
export const MyNewEmailTemplate = {
  generate(clientName: string, data: any): EmailTemplate {
    return {
      subject: "Email Subject",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: ${EMAIL_CONFIG.COLORS.PRIMARY_BLUE}; margin-bottom: 20px;">
            Your Title
          </h2>
          <p>Bonjour ${clientName},</p>
          <!-- Your content here -->
          ${generateEmailFooter()}
        </div>
      `,
    };
  },
};
```

Then use it in `email-service.ts`:

```typescript
static async sendMyNewEmail(data: any) {
  const template = MyNewEmailTemplate.generate(data.clientName, data);

  return await resend.emails.send({
    from: EMAIL_CONFIG.FROM_EMAIL,
    to: data.clientEmail,
    subject: template.subject,
    html: template.html,
  });
}
```

## Available Email Templates

### 1. **ConfirmationEmailTemplate**

- Sent when a single appointment is booked
- Shows appointment details and access button (for online) or address (for in-person)
- **Usage:** `ConfirmationEmailTemplate.generate(appointment)`

### 2. **RecurringSeriesConfirmationEmailTemplate**

- Sent when recurring appointments are created
- Shows list of all upcoming appointments in the series
- **Usage:** `RecurringSeriesConfirmationEmailTemplate.generate(appointments)`

### 3. **TwentyFourHourReminderEmailTemplate**

- Sent 24 hours before an appointment
- Reminds client about upcoming appointment
- **Usage:** `TwentyFourHourReminderEmailTemplate.generate(appointment)`

### 4. **OneHourReminderEmailTemplate**

- Sent 1 hour before an appointment
- For online appointments: includes join button
- For in-person: includes address reminder
- **Usage:** `OneHourReminderEmailTemplate.generate(appointment)`

### 5. **InvoiceEmailTemplate**

- Sent after appointment to deliver invoice
- **Usage:** `InvoiceEmailTemplate.generate(appointment, invoiceHtml)`

### 6. **RescheduleNotificationEmailTemplate**

- Sent when appointment is rescheduled
- Shows old and new appointment times
- **Usage:** `RescheduleNotificationEmailTemplate.generate(appointment, oldStartTime)`

### 7. **CancellationEmailTemplate**

- Sent when appointment is cancelled
- **Usage:** `CancellationEmailTemplate.generate(appointment)`

### 8. **GenericNotificationEmailTemplate**

- Generic template for custom notifications
- **Usage:** `GenericNotificationEmailTemplate.generate(clientName, title, message)`

## Helper Functions

### `formatAppointmentDate(date: Date, format_string?: string)`

Formats dates in French locale. Default format: "EEEE dd MMMM yyyy 'à' HH:mm"

### `generateAppointmentLink(appointment: Appointment)`

Generates appropriate link based on appointment format (online or in-person)

### `generateAppointmentButton(appointment: Appointment, buttonText: string)`

Creates a styled button linking to appointment

### `generateAppointmentInfoBox(appointment: Appointment, startTime: string)`

Shows appointment details in a styled box

### `generateEmailFooter()`

Generates footer with doctor signature

## How Emails Are Sent

### Single Appointment

1. User books appointment → `ConfirmationEmailTemplate` sent
2. 24h before → `TwentyFourHourReminderEmailTemplate` sent
3. 1h before → `OneHourReminderEmailTemplate` sent
4. After appointment → `InvoiceEmailTemplate` sent

### Recurring Series

1. User books series → `RecurringSeriesConfirmationEmailTemplate` sent
2. For each appointment in series:
   - 1h before → `OneHourReminderEmailTemplate` sent
   - After appointment → `InvoiceEmailTemplate` sent

## Updating Email Address

When updating the sender email, change in `EMAIL_CONFIG`:

```typescript
FROM_EMAIL: "your-new-email@yourdomain.com";
```

## Testing Emails

To test email templates:

1. Modify `EMAIL_CONFIG` temporarily if needed
2. Test in development using Resend's preview
3. Check email rendering across clients (Gmail, Outlook, etc.)

## Best Practices

1. ✅ Always use `EMAIL_CONFIG` for branding/addresses
2. ✅ Use helper functions to avoid duplication
3. ✅ Maintain consistent French formatting
4. ✅ Test responsive design (mobile/desktop)
5. ✅ Use template variables for dynamic content
6. ❌ Don't hardcode emails, addresses, or doctor names

## Integration Points

### email-service.ts

```typescript
import {
  ConfirmationEmailTemplate,
  RecurringSeriesConfirmationEmailTemplate,
  EMAIL_CONFIG,
} from "./email-templates";

// Use templates like:
const template = ConfirmationEmailTemplate.generate(appointment);
```

### email-scheduler.ts

Uses `email-service.ts` methods - no direct template usage needed

### appointments.ts

Uses `EmailService` methods - no direct template usage needed

## Migration Notes

All existing email functionality has been preserved. No breaking changes - just reorganized for easier maintenance.
