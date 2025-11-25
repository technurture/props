# Service Charges and Patient Billing Guide

## Overview
Service charges in your EMR system serve as a **pricing catalog** that determines how much patients are billed for different medical services. When a patient completes their visit, the system automatically generates an invoice using the active service charges configured for that branch.

## How Service Charges Work

### 1. Service Charge Categories

Service charges are organized into **8 categories**:

| Category | Purpose | Example Services |
|----------|---------|-----------------|
| **Consultation** | Doctor consultation fees | General Consultation, Specialist Consultation |
| **Laboratory** | Lab test pricing | Blood Test, Urinalysis, X-Ray Analysis |
| **Pharmacy** | Medication pricing/markup | Pharmacy Markup Percentage |
| **Procedure** | Medical procedures | Minor Surgery, Wound Dressing |
| **Imaging** | Imaging services | X-Ray, Ultrasound, CT Scan |
| **Emergency** | Emergency services | Emergency Consultation, Trauma Care |
| **Admission** | Admission fees | Ward Admission, ICU Admission |
| **Other** | Miscellaneous services | Medical Certificate, Report Copy |

### 2. Automatic Invoice Generation

When a patient visit is completed, the system automatically:

1. **Checks for active service charges** for that branch
2. **Identifies billable items** from the visit:
   - Consultation (if doctor saw the patient)
   - Prescriptions (medications ordered)
   - Lab tests (tests performed)
   - Procedures (if any were done)
3. **Calculates pricing** using your service charges
4. **Generates an invoice** with all items

### 3. Service Charge Pricing Logic

#### Consultation Fees
```
When: Doctor clocks in to see patient
Pricing: Uses "Consultation" category service charge
Example: "General Consultation" = ₦5,000
```

#### Laboratory Tests
```
When: Lab test is ordered for patient
Pricing: System searches for:
  1. Exact test name match (e.g., "Complete Blood Count")
  2. Test category match (e.g., "Hematology")
  3. Falls back to "Laboratory Base" price if no match
Example: "Complete Blood Count" = ₦3,500
```

#### Pharmacy/Medications
```
When: Doctor prescribes medications
Pricing: 
  1. Base price from pharmacy inventory
  2. Multiplied by pharmacy markup from service charges
Example: 
  - Paracetamol base price: ₦500
  - Pharmacy markup: 20% (1.2)
  - Patient pays: ₦600
```

#### Other Services
```
When: Procedures, imaging, or other services are performed
Pricing: Uses specific service charge by name/category
Example: "Wound Dressing" = ₦2,000
```

## Service Charge Configuration

### Required Fields
- **Service Name**: Descriptive name (e.g., "General Consultation")
- **Category**: One of the 8 categories
- **Price**: Amount in Naira (₦)
- **Status**: Active/Inactive (only active charges are used)
- **Description**: Optional details about the service

### Best Practices

1. **Create Standard Services**
   - General Consultation
   - Laboratory Base (default lab test price)
   - Pharmacy Markup (as a percentage, e.g., 1.2 for 20%)

2. **Use Specific Names**
   - For lab tests: Match exact test names from your lab
   - For procedures: Use clear procedure names
   - For medications: Use pharmacy markup for consistency

3. **Keep Prices Updated**
   - Review and update prices regularly
   - Deactivate outdated services instead of deleting
   - Create new versions when prices change

## Invoice Calculation Example

**Patient Visit**: John Doe completes a visit

**Services Provided**:
- Doctor consultation
- Prescribed: Paracetamol (Qty: 20)
- Lab test: Complete Blood Count

**Pricing** (from active service charges):
```
Consultation Fee:           ₦5,000
Medication (Paracetamol):   ₦600  (₦500 × 1.2 markup × 1 qty)
Lab Test (CBC):             ₦3,500

Subtotal:                   ₦9,100
Tax (7.5%):                 ₦683
Discount:                   ₦0
─────────────────────────────────
Grand Total:                ₦9,783
```

**If patient has insurance**:
- Insurance covers 30% (configurable)
- Patient pays: ₦6,848
- Insurance claim: ₦2,935

## Fallback Pricing

If no service charge is configured, the system uses **default pricing**:
```
Consultation:     ₦5,000
Lab Test Base:    ₦3,000
Pharmacy Markup:  1.2 (20%)
```

## Branch-Specific Pricing

Service charges are **branch-specific**, meaning:
- Each branch can have different pricing
- Allows for location-based pricing strategies
- Central branches might charge more than satellite clinics

## Managing Service Charges

### Adding a New Service Charge
1. Click "New Service Charge" button
2. Enter service name and select category
3. Set the price in Naira
4. Add optional description
5. Set status to Active
6. Save

### Editing a Service Charge
1. Click the three-dot menu (⋮) next to the service
2. Select "Edit"
3. Update the details
4. Save changes

### Deactivating a Service
- Set status to "Inactive" instead of deleting
- Inactive services won't be used for new invoices
- Historical invoices remain unchanged

## Impact on Patient Billing

✅ **Active Service Charges** → Used for new invoices
❌ **Inactive Service Charges** → Ignored (defaults used)
🔒 **Existing Invoices** → Never change (locked prices)

## Tips for Accurate Billing

1. ✓ Create service charges for ALL common services
2. ✓ Use clear, descriptive names
3. ✓ Keep service charges active and updated
4. ✓ Review invoices regularly to ensure correct pricing
5. ✓ Match service names to your actual services
6. ✓ Set competitive prices based on your market

## Troubleshooting

**Q: Invoice shows default prices instead of my configured prices**
- Check if service charges are Active
- Verify the service name matches what you expect
- Ensure service charges exist for that branch

**Q: Lab test shows wrong price**
- Create a specific service charge with exact test name
- Or create a category-level price for "Laboratory"

**Q: Medication prices seem wrong**
- Check pharmacy inventory base prices
- Verify pharmacy markup service charge
- Formula: Base Price × Markup = Patient Price

---

*Last Updated: October 19, 2025*
