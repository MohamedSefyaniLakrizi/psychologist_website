# Email Automation Setup Guide

## 📧 Overview

Your appointment system now includes a comprehensive email automation feature with:

- **Instant confirmation emails** when appointments are created
- **24-hour reminder emails** (scheduled in database, sent via cron)
- **1-hour reminder emails** (scheduled in database, sent via cron)

## 🔧 Required Setup

### 1. Environment Variables

Update your `.env` file with:

```env
# Get your API key from https://resend.com/api-keys
RESEND_API_KEY="re_your_actual_api_key_here"

# Generate a secure random string for cron job protection
CRON_SECRET="your_secure_random_string_here"
```

### 2. Resend Configuration

1. Sign up at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key
4. Replace `"your_resend_api_key_here"` in your `.env` file

### 3. Vercel Deployment

When deploying to Vercel:

1. Add the environment variables in your Vercel dashboard
2. The `vercel.json` file is already configured for 5-minute cron jobs
3. Cron jobs will automatically process scheduled emails

## 🚀 How It Works

### Email Flow for Single Appointments

1. **Appointment Created** → Confirmation email sent immediately via Resend
2. **24h Before** → Reminder email sent via cron job
3. **1h Before** → Final reminder email sent via cron job

### Email Flow for Recurring Appointments

1. **Appointments Created** → **ONE** series confirmation email sent immediately (acknowledges all appointments and explains individual reminders)
2. **24h Before Each** → Individual reminder email sent via cron job for each appointment
3. **1h Before Each** → Individual reminder email sent via cron job for each appointment

### Key Differences

- **Single**: 1 confirmation + 2 reminders per appointment
- **Recurring**: 1 series confirmation + 2 reminders per appointment (no individual confirmations)

### Email Scheduling

- Emails are stored in the `EmailSchedule` table
- Cron job at `/api/cron/process-emails` processes pending emails
- Failed emails are marked and can be retried
- Cancelled appointments automatically cancel their emails

## 📊 Database Schema

```sql
-- New table for email scheduling
model EmailSchedule {
  id            String      @id @default(cuid())
  appointmentId String
  emailType     EmailType
  scheduledFor  DateTime
  status        EmailStatus @default(PENDING)
  sentAt        DateTime?
  error         String?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  appointment   Appointment @relation(fields: [appointmentId], references: [id], onDelete: Cascade)
}

enum EmailType {
  CONFIRMATION
  REMINDER_24H
  REMINDER_1H
}

enum EmailStatus {
  PENDING
  SENT
  CANCELLED
  FAILED
}
```

## 🧪 Testing

### Test Confirmation Email

Create a new appointment - you should receive a confirmation email immediately.

### Test Reminder Emails

1. Create an appointment for tomorrow
2. Check the database for scheduled emails:
   ```sql
   SELECT * FROM "EmailSchedule" WHERE status = 'PENDING';
   ```
3. Wait for cron job to process (or manually trigger the endpoint)

### Manual Cron Test

```bash
curl -X POST http://localhost:3000/api/cron/process-emails \
  -H "Authorization: Bearer your_cron_secret_here"
```

## 🛠️ Troubleshooting

### Email Not Sending

1. Check Resend API key is correct
2. Verify domain is verified in Resend
3. Check application logs for errors

### Cron Jobs Not Working

1. Ensure `CRON_SECRET` is set
2. Check Vercel function logs
3. Verify `vercel.json` is deployed

### Database Issues

```bash
# Reset and regenerate Prisma client
npx prisma generate
npx prisma db push
```

## 📝 File Structure

```
lib/
├── services/
│   ├── email-service.ts      # Handles actual email sending
│   └── email-scheduler.ts    # Manages email scheduling
└── actions/
    └── appointments.ts       # Updated with email integration

app/api/cron/
└── process-emails/
    └── route.ts             # Cron job endpoint

vercel.json                  # Cron configuration
```

## 🎯 Features

- ✅ Immediate confirmation emails
- ✅ Scheduled reminder emails
- ✅ Automatic email cancellation
- ✅ Error handling and retry logic
- ✅ HTML email templates
- ✅ Recurring appointment support
- ✅ Database-driven scheduling
- ✅ Secure cron endpoint

Your email automation system is now ready! 🎉
