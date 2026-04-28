## 📋 E2E Real Tests Documentation

### ⚠️ CRITICAL REQUIREMENT

**All E2E tests in this directory MUST be executed against the remote deployed environment:**

```
URL Base: https://producers.origen.delivery
Environment: Production-like (testlab.origen.es)
```

❌ **WILL NOT WORK** on localhost or mock environments  
✅ **REQUIRED** for testing real flows: authentication, database persistence, external integrations (Stripe, media uploads, etc.)

---

## 📝 Available E2E Real Tests

### 1. **Product Creation & Editing**
- **File:** `tests/e2e/dashboard/products-create-real.spec.ts`
- **Coverage:**
  - ✅ Create product with all 7 steps (basic, images, pricing, nutritional, production, inventory, certifications)
  - ✅ Upload valid images (1400x1400 px minimum)
  - ✅ Add manual certifications with documents
  - ✅ Publish product
  - ✅ Edit created product
  - ✅ Verify data persistence after reload
- **Tests:** 3 (create, edit, persist)
- **Duration:** ~46 seconds total
- **Data Cleanup:** Products use timestamp in name for uniqueness

**Run:**
```bash
$env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'
$env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.carmen.1777238090175@testlab.origen.es'
$env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
npx playwright test tests/e2e/dashboard/products-create-real.spec.ts --project=chromium
```

---

### 2. **Account: Security, Payments & Business**
- **File:** `tests/e2e/dashboard/account-security-payments-business-real.spec.ts`
- **Coverage:**
  - ✅ Authentication as producer
  - ✅ Security section: access change password form
  - ✅ Payments section: validate Stripe integration status
  - ✅ Business section: load persisted onboarding data
  - ✅ Edit business fields without losing information
  - ✅ Verify data persistence across page reloads
  - ✅ Validate all account hub links work correctly
- **Tests:** 7 (authentication, security, payments, business load, edit, persist, hub navigation)
- **Duration:** ~10 seconds per test (70 seconds total)
- **Critical Validations:**
  - Onboarding data (businessName, description, location) auto-loads in "Mi Negocio"
  - User should NOT need to re-enter data already saved during onboarding
  - Stripe connection status displays correctly
  - Change password form is accessible and validated

**Run:**
```bash
$env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'
$env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.miguel.1777238090175@testlab.origen.es'
$env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
npx playwright test tests/e2e/dashboard/account-security-payments-business-real.spec.ts --project=chromium
```

---

## 🔐 Test Credentials

### Carmen (Product Management)
```
Email:    e2e.carmen.1777238090175@testlab.origen.es
Password: Password1!
Use for: Product creation, certification testing
Status:   Active, fully onboarded
```

### Miguel (Account & Business)
```
Email:    e2e.miguel.1777238090175@testlab.origen.es
Password: Password1!
Use for: Security, payments, business profile editing
Status:   Active, fully onboarded
```

**Important:** Credentials stored in `testlab.origen.es` environment. Use exact email/password as shown.

---

## 🚀 Running All E2E Real Tests

### Single Test File
```bash
# Products
$env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'
$env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.carmen.1777238090175@testlab.origen.es'
$env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
npx playwright test tests/e2e/dashboard/products-create-real.spec.ts --project=chromium

# Account (Security + Payments + Business)
$env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'
$env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.miguel.1777238090175@testlab.origen.es'
$env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
npx playwright test tests/e2e/dashboard/account-security-payments-business-real.spec.ts --project=chromium
```

### All E2E Real Tests (Sequential)
```bash
$env:PLAYWRIGHT_BASE_URL='https://producers.origen.delivery'

# Products
$env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.carmen.1777238090175@testlab.origen.es'
$env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
npx playwright test tests/e2e/dashboard/products-create-real.spec.ts --project=chromium

# Account
$env:E2E_ACTIVE_PRODUCER_EMAIL='e2e.miguel.1777238090175@testlab.origen.es'
$env:E2E_ACTIVE_PRODUCER_PASSWORD='Password1!'
npx playwright test tests/e2e/dashboard/account-security-payments-business-real.spec.ts --project=chromium
```

---

## 🔧 Environment Setup

### Prerequisites
1. **Playwright installed:** `npm install -D @playwright/test`
2. **origen-dashboard dependencies:** `npm install`
3. **Network access:** Must be able to reach `https://producers.origen.delivery`
4. **Test user accounts:** Must exist in remote environment

### Configuration File
- **Location:** `playwright.config.ts`
- **Behavior:** Auto-selects remote URL when `PLAYWRIGHT_BASE_URL` env var is set
- **No local server needed** for real E2E tests

---

## 📊 Test Execution Flow

### Products Test Flow
```
1. Login as Carmen
2. Navigate to /dashboard/products/create
3. Fill basic info (name, category, descriptions)
4. Upload image (1400x1400 px)
5. Fill pricing, nutritional info, production, inventory
6. Add manual certification with PDF
7. Publish product
8. Verify redirect + success message
9. Open created product for edit
10. Update data + publish
11. Reload page + verify persistence
```

### Account Test Flow
```
1. Login as Miguel
2. Check /dashboard/security (change password form accessible)
3. Check /dashboard/configuracion/pagos (Stripe status loads)
4. Check /dashboard/profile/business (onboarding data auto-loads)
5. Edit business description + save
6. Navigate away and return
7. Verify description change persisted
8. Test account hub navigation to all sections
```

---

## ✅ Data Persistence Validation

### What Should Be Pre-loaded in "Mi Negocio"
After completing onboarding, the following fields should auto-populate in `/dashboard/profile/business`:

| Field | Source | Expected | Status |
|-------|--------|----------|--------|
| businessName | Step 2 | "Empresa E2E Test" | ✅ Must load |
| description | Step 2 | "Descripción..." | ✅ Must load |
| tagline | Step 2 | Marketing tagline | ✅ Must load |
| website | Step 2 | "https://..." | ✅ Must load |
| instagram | Step 2 | "@handle" | ✅ Must load |
| taxId (NIF/CIF) | Step 1 | "12345678A" | ✅ Must load |
| location | Step 1 | Full address | ✅ Must load |
| foundedYear | Step 1 | 2020 | ✅ Must load |
| teamSize | Step 1 | "THREE_FIVE" | ✅ Must load |
| logo | Step 3 | Image key | ✅ Must load |
| banner | Step 3 | Image key | ✅ Must load |

### Critical Issue Being Tested
**User should NOT be required to re-enter data already saved during onboarding.**

If a field is empty in "Mi Negocio" when it was filled during onboarding, this is a **bug** and should be reported.

---

## 🐛 Troubleshooting

### Test Fails: "Login Failed (401)"
- **Cause:** Incorrect email or password
- **Solution:** Verify exact credentials:
  - Carmen: `e2e.carmen.1777238090175@testlab.origen.es`
  - Miguel: `e2e.miguel.1777238090175@testlab.origen.es`
  - Password: `Password1!` (both accounts)

### Test Fails: "Cannot reach https://producers.origen.delivery"
- **Cause:** Network issue or URL is down
- **Solution:** 
  - Check network connectivity
  - Verify URL is accessible: `curl https://producers.origen.delivery`
  - If down, tests must wait for deployment

### Test Fails: "Image rejected (500)"
- **Cause:** Image size or format invalid
- **Solution:** 
  - Minimum size: 1400x1400 px
  - Format: PNG (JPEG also works)
  - File: `tests/e2e/fixtures/test-image-valid.png`

### Test Fails: "Button not clickable (overlay)"
- **Cause:** Spinner or modal blocking interaction
- **Solution:** Test uses `{ force: true }` - if still fails, increase timeout

---

## 📈 Expected Results

### Products Test Results
```
✅ Test 1: Create product with all fields + certification — PASSED (19.7s)
✅ Test 2: Edit created product + update certification — PASSED (13.3s)
✅ Test 3: Verify data persistence after reload — PASSED (13.0s)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3 passed in 46s
```

### Account Test Results (Expected)
```
✅ Test 1: Authenticate and access dashboard — PASSED
✅ Test 2: Security section accessible — PASSED
✅ Test 3: Payments/Stripe status loads — PASSED
✅ Test 4: Business data loads (onboarding persisted) — PASSED
✅ Test 5: Edit business fields — PASSED
✅ Test 6: Data persists across reloads — PASSED
✅ Test 7: Account hub navigation works — PASSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7 passed in ~70s
```

---

## 📋 CI/CD Integration

These tests can be integrated into GitHub Actions for continuous testing:

```yaml
name: E2E Real Tests
on: [push, pull_request]

jobs:
  e2e-real:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: cd origen-dashboard && npm install
      - run: npx playwright install chromium
      - name: Run E2E Products Tests
        env:
          PLAYWRIGHT_BASE_URL: https://producers.origen.delivery
          E2E_ACTIVE_PRODUCER_EMAIL: e2e.carmen.1777238090175@testlab.origen.es
          E2E_ACTIVE_PRODUCER_PASSWORD: ${{ secrets.E2E_CARMEN_PASSWORD }}
        run: npx playwright test tests/e2e/dashboard/products-create-real.spec.ts
      - name: Run E2E Account Tests
        env:
          PLAYWRIGHT_BASE_URL: https://producers.origen.delivery
          E2E_ACTIVE_PRODUCER_EMAIL: e2e.miguel.1777238090175@testlab.origen.es
          E2E_ACTIVE_PRODUCER_PASSWORD: ${{ secrets.E2E_MIGUEL_PASSWORD }}
        run: npx playwright test tests/e2e/dashboard/account-security-payments-business-real.spec.ts
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📝 Notes

- Tests use `.serial()` to run sequentially (data dependencies)
- Timestamps used in product names to ensure uniqueness
- No cleanup of test data by default (manual inspection recommended)
- Tests validate UI changes, not API contracts (integration layer)
- Stripe connection tests validate UI display, not actual Stripe integration
