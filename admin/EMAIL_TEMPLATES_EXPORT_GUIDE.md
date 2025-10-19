# Email Templates Export Guide

## What Was Done

All email templates have been consolidated from scattered code into a single, centralized location for easy management and customization.

### Before

- Email HTML was embedded in `email-service.ts`
- Hard to find and edit templates
- Duplication of styling code
- Doctor name and address hardcoded in multiple places

### After

- All templates in `lib/services/email-templates.ts`
- Centralized configuration in `EMAIL_CONFIG`
- Reusable helper functions
- Single source of truth for branding

---

## File Structure

```
admin/
├── lib/
│   └── services/
│       ├── email-templates.ts          ← All email templates (NEW)
│       ├── email-service.ts            ← Uses templates (REFACTORED)
│       └── email-scheduler.ts          ← Unchanged
├── EMAIL_TEMPLATES_GUIDE.md            ← Detailed documentation
└── EMAIL_TEMPLATES_QUICK_REFERENCE.md  ← Quick reference
```

---

## What Can Be Exported and Customized

### Configuration (EMAIL_CONFIG)

```typescript
FROM_EMAIL; // Sender email
DOCTOR_NAME; // Doctor's name
DOCTOR_TITLE; // Professional title
OFFICE_NAME; // Office/clinic name
OFFICE_ADDRESS; // Full address
COLORS; // All color codes
WEBSITE_URL; // Base URL for links
```

### Templates (All Exportable)

```typescript
ConfirmationEmailTemplate; // Single appointment
RecurringSeriesConfirmationEmailTemplate; // Recurring series
TwentyFourHourReminderEmailTemplate; // Day before reminder
OneHourReminderEmailTemplate; // 1 hour before reminder
InvoiceEmailTemplate; // Invoice delivery
RescheduleNotificationEmailTemplate; // Reschedule notice
CancellationEmailTemplate; // Cancellation notice
GenericNotificationEmailTemplate; // Custom notifications
```

### Helper Functions (All Exportable)

```typescript
formatAppointmentDate(); // Format dates in French
generateAppointmentLink(); // Create appointment links
generateAppointmentButton(); // Generate styled buttons
generateAppointmentInfoBox(); // Create info boxes
generateEmailFooter(); // Add footer to emails
```

---

## Usage Examples

### Using in Email Service

```typescript
import { ConfirmationEmailTemplate, EMAIL_CONFIG } from "./email-templates";

const template = ConfirmationEmailTemplate.generate(appointment);

await resend.emails.send({
  from: EMAIL_CONFIG.FROM_EMAIL,
  to: appointment.client.email,
  subject: template.subject,
  html: template.html,
});
```

### Using in Custom Code

```typescript
// Import what you need
import {
  TwentyFourHourReminderEmailTemplate,
  InvoiceEmailTemplate,
  EMAIL_CONFIG,
} from "@/lib/services/email-templates";

// Generate template
const reminderTemplate =
  TwentyFourHourReminderEmailTemplate.generate(appointment);

// Access configuration
console.log(EMAIL_CONFIG.DOCTOR_NAME);
console.log(EMAIL_CONFIG.COLORS.PRIMARY_BLUE);
```

---

## Customization Workflow

### 1. Update Doctor/Office Info

Edit `EMAIL_CONFIG` in `email-templates.ts`:

```typescript
export const EMAIL_CONFIG = {
  FROM_EMAIL: "contact@mydomain.com",
  DOCTOR_NAME: "Dr. Your Name",
  DOCTOR_TITLE: "Your Title",
  OFFICE_NAME: "Your Office Name",
  OFFICE_ADDRESS: "Your Full Address",
  // ...
};
```

### 2. Change Email Styling

Modify template HTML or colors:

```typescript
export const ConfirmationEmailTemplate = {
  generate(appointment: Appointment): EmailTemplate {
    return {
      subject: "Custom Subject",
      html: `
        <div style="...">
          <!-- Your custom HTML -->
        </div>
      `,
    };
  },
};
```

### 3. Add New Template

```typescript
export const MyNewTemplate = {
  generate(data: any): EmailTemplate {
    return {
      subject: "Subject",
      html: `HTML content`,
    };
  },
};
```

### 4. Use in Email Service

```typescript
static async sendMyNew(data: any) {
  const template = MyNewTemplate.generate(data);
  return await resend.emails.send({
    from: EMAIL_CONFIG.FROM_EMAIL,
    to: data.email,
    subject: template.subject,
    html: template.html,
  });
}
```

---

## Template Contract

All templates implement this interface:

```typescript
interface EmailTemplate {
  html: string; // HTML content
  subject: string; // Email subject
}
```

Each template has a `generate()` function that takes appointment/data and returns `EmailTemplate`.

---

## Integration Points

### In appointments.ts

Uses `EmailService` to send emails - no template imports needed

### In email-service.ts

Imports templates from `email-templates.ts` and sends them via Resend

### In email-scheduler.ts

No template usage - just schedules calls to `EmailService`

---

## Benefits of This Structure

✅ **Single Source of Truth** - All templates in one file
✅ **Easy Customization** - Change email once, used everywhere
✅ **Brand Consistency** - Use `EMAIL_CONFIG` for all branding
✅ **Reusable Code** - Helper functions avoid duplication
✅ **Easy Testing** - Can test templates independently
✅ **Clear Organization** - Related code grouped together
✅ **Scalable** - Easy to add new templates
✅ **Maintainable** - No scattered HTML snippets
✅ **Type Safe** - TypeScript interfaces for templates
✅ **Well Documented** - Templates self-documenting

---

## Next Steps

1. ✅ Templates consolidated into single file
2. ✅ Email service refactored to use templates
3. ✅ Configuration centralized in EMAIL_CONFIG
4. Next: Customize `EMAIL_CONFIG` for your practice
5. Then: Test all email templates
6. Finally: Deploy with confidence!

---

## Support Files

- `EMAIL_TEMPLATES_GUIDE.md` - Comprehensive documentation
- `EMAIL_TEMPLATES_QUICK_REFERENCE.md` - Quick customization guide
- `lib/services/email-templates.ts` - All template code
- `lib/services/email-service.ts` - Email sending implementation

---

## Questions?

### How to change doctor name?

→ Edit `EMAIL_CONFIG.DOCTOR_NAME` in `email-templates.ts`

### How to add a new email type?

→ Create new template in `email-templates.ts`, add method to `EmailService`

### How to change email styling?

→ Modify the HTML in the template's `generate()` function

### Where are appointment links generated?

→ In `generateAppointmentLink()` helper function

### Can I customize individual templates?

→ Yes! Edit any template's `generate()` function

### How do I test templates locally?

→ Use Resend's preview in dashboard during development
