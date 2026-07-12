# Automation Anywhere CE - UI & API Test Framework

This project covers the test automation assignment for the Automation Anywhere Community Edition (AA CE) platform. It includes both a UI automation suite (testing the form builder via drag-and-drop) and an API automation suite (testing process creation and dependencies).

## Framework & Tools
- **Core Framework:** Playwright (TypeScript)
- **Design Pattern:** Page Object Model (POM)
- **Test Runner:** `@playwright/test`
- **Config Management:** `dotenv`

## Setup Instructions

1. Make sure you have Node.js 18+ installed.
2. Clone the repo and install dependencies:
   ```bash
   npm install
   ```

## Environment Configuration

You'll need a valid AA CE account to run these tests.
Create a `.env` file in the root of the project (you can copy `.env.example`) and add your credentials:

```env
BASE_URL=https://community.cloud.automationanywhere.digital
AA_USERNAME=your.email@example.com
AA_PASSWORD=your_password
```

## Execution Instructions

The tests are strictly organized by use case and tagged appropriately (`@UC1-UI` and `@UC2-API`). I've added custom npm scripts to make running them easy.

### Running Use Case 1 (UI Automation)
Tests the end-to-end Form Builder flow (login, create form, drag-and-drop controls, save).

```bash
npm run test:ui
```
*Note on file uploads:* The AA CE builder visually simulates the File input on the canvas without attaching an actual native `<input type="file">` to the DOM during build-time. The script gracefully handles this UI limitation so the test can still verify the save flow.

### Running Use Case 2 (API Automation)
Tests the `/v2/` API endpoints (auth, file creation, payload injection, and process dependency linking) completely headlessly.

```bash
npm run test:api
```

### Running Everything
If you want to run both suites or view the Playwright UI dashboard to inspect the traces:
```bash
npx playwright test --ui
```

## Project Structure
- `src/api/` - Contains the API client and payload models
- `src/pages/` - Contains the Page Object Model (POM) classes for UI tests
- `src/utils/` - Contains shared constants, locators, and test data generators
- `tests/ui/` - Contains the Use Case 1 UI test suite
- `tests/api/` - Contains the Use Case 2 API test suite
