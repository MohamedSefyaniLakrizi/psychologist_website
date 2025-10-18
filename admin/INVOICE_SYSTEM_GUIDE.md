# Invoice System Implementation Guide

## What Was Created

### 1. Database Schema Changes (`prisma/schema.prisma`)

- **Added Invoice model** with fields:
  - `id`, `clientId`, `appointmentId` (optional), `amount`, `status`, `paymentMethod`, `description`, `dueDate`, `paidAt`
  - Relationships to Client and Appointment models
  - Indexes for performance

- **Updated Client model** to include `invoices` relation
- **Updated Appointment model** to remove `rate` and `paid` fields, added `invoice` relation
- **Added new enums**: `InvoiceStatus` (UNPAID, PAID, OVERDUE), `PaymentMethod` (CASH, CARD, BANK_TRANSFER, CHECK, OTHER)

### 2. Server Actions (`lib/actions/invoices.ts`)

- `getInvoices()` - Fetch all invoices with client and appointment data
- `getInvoice(id)` - Fetch single invoice
- `createInvoice(data)` - Create new invoice
- `updateInvoice(id, data)` - Update existing invoice (handles payment status)
- `deleteInvoice(id)` - Delete invoice
- `getInvoicesByClient(clientId)` - Get invoices for specific client
- `markInvoiceOverdue()` - Automatically mark overdue invoices

### 3. Invoice Management Page (`app/invoices/page.tsx`)

- **Comprehensive dashboard** with:
  - Summary cards showing totals (total, paid, unpaid, overdue)
  - Filters by status and client
  - Create/edit invoice dialogs
  - Data table with all invoice information
  - Payment method tracking
  - Due date management

### 4. Navigation (`app/components/layout/app-sidebar.tsx`)

- Added "Factures" menu item with Receipt icon

### 5. Automatic Invoice Creation (`lib/actions/appointments.ts`)

- Modified `createAppointment` to automatically create invoices for:
  - Single appointments
  - Each appointment in recurring series
- Invoices are set to UNPAID status with 30-day due date
- Amount comes from appointment rate
- Description includes appointment date

## Migration Instructions

### Step 1: Handle Existing Data

Since you have existing appointments with `rate` and `paid` fields, you need to migrate the data carefully:

```bash
# 1. First, create a backup of your database
pg_dump your_database_url > backup_before_invoice_migration.sql

# 2. Create invoices for existing appointments before running migration
# Run this SQL to create invoices for existing appointments:
```

```sql
-- Create invoices for existing appointments
INSERT INTO "Invoice" (id, "clientId", "appointmentId", amount, status, description, "dueDate", "createdAt", "updatedAt")
SELECT
    gen_random_uuid() as id,
    "clientId",
    id as "appointmentId",
    rate as amount,
    CASE
        WHEN paid = true THEN 'PAID'::InvoiceStatus
        ELSE 'UNPAID'::InvoiceStatus
    END as status,
    'Migration - Consultation du ' || to_char("startTime", 'DD/MM/YYYY') as description,
    "startTime" + interval '30 days' as "dueDate",
    "createdAt",
    "updatedAt"
FROM "Appointment";
```

### Step 2: Run the Migration

```bash
# Now run the migration to remove rate and paid fields
npx prisma migrate dev --name add-invoice-system
```

### Step 3: Update Existing Code

Any code that references `appointment.rate` or `appointment.paid` needs to be updated to use `appointment.invoice.amount` and `appointment.invoice.status`.

## Features

### Invoice Management

- ✅ Create invoices manually or automatically with appointments
- ✅ Link invoices to clients and appointments (optional)
- ✅ Track payment status (UNPAID, PAID, OVERDUE)
- ✅ Set due dates and payment methods
- ✅ Automatic overdue detection
- ✅ Filter and search invoices
- ✅ Summary dashboard with totals

### Integration with Appointments

- ✅ Automatic invoice creation when appointments are created
- ✅ Proper amount transfer from appointment rate
- ✅ Works with both single and recurring appointments
- ✅ Maintains client relationships

### User Interface

- ✅ Modern, responsive design
- ✅ Status indicators with colors and icons
- ✅ Edit/delete functionality
- ✅ Client and appointment selection
- ✅ Payment method tracking
- ✅ Due date management

## Next Steps

1. **Run the migration** following the steps above
2. **Test the invoice creation** by creating new appointments
3. **Verify data integrity** by checking that all existing appointments have corresponding invoices
4. **Update any dashboard or reporting** that previously used appointment.paid/rate
5. **Consider adding invoice PDF generation** for client billing
6. **Set up recurring overdue checks** (maybe a daily cron job calling `markInvoiceOverdue()`)

## API Endpoints

All invoice operations are handled through server actions:

- Create: `createInvoice(data)`
- Read: `getInvoices()`, `getInvoice(id)`
- Update: `updateInvoice(id, data)`
- Delete: `deleteInvoice(id)`

The invoice system is now ready and integrated with your appointment system!
