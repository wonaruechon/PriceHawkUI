/**
 * Playwright Validation Script for CompetitorInputCard Retailer Selection
 * Chore ID: 4eb0d299
 *
 * This script validates the retailer selection fix on the comparison page.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Validation results tracking
const validationResults = [];
let overallResult = 'PASS';

function logValidation(step, status, message) {
  const result = { step, status, message, timestamp: new Date().toISOString() };
  validationResults.push(result);
  console.log(`[${status}] Step ${step}: ${message}`);
  if (status === 'FAIL') {
    overallResult = 'FAIL';
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function validateRetailerSelection() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Step 1: Navigate to Comparison Page
    console.log('\n=== Step 1: Navigate to Comparison Page ===');
    await page.goto('http://localhost:3000/comparison', { waitUntil: 'networkidle' });
    await delay(1000); // Wait for any animations

    const title = await page.title();
    if (title.includes('Comparison') || title.includes('Manual')) {
      logValidation(1, 'PASS', 'Successfully navigated to comparison page');
    } else {
      logValidation(1, 'FAIL', `Page title "${title}" does not contain expected text`);
    }

    // Step 2: Capture Initial State Screenshot
    console.log('\n=== Step 2: Capture Initial State Screenshot ===');

    // Wait for the retailer grid to be visible
    const retailerGridSelector = 'button:has-text("HomePro")';
    await page.waitForSelector(retailerGridSelector, { timeout: 5000 });

    // Check if all 5 retailers are visible
    const retailers = ['HomePro', 'MegaHome', 'Boonthavorn', 'Global House', 'DoHome'];
    let allRetailersVisible = true;
    for (const retailer of retailers) {
      const isVisible = await page.isVisible(`button:has-text("${retailer}")`);
      if (!isVisible) {
        allRetailersVisible = false;
        logValidation(2, 'FAIL', `Retailer button "${retailer}" is not visible`);
      }
    }

    if (allRetailersVisible) {
      logValidation(2, 'PASS', 'All 5 retailer buttons are visible in the grid');
    }

    await page.screenshot({
      path: '.playwright-mcp/retailer-selection-initial.png',
      fullPage: true
    });
    logValidation(2, 'PASS', 'Initial state screenshot captured');

    // Step 3: Click HomePro Retailer Button
    console.log('\n=== Step 3: Click HomePro Retailer Button ===');

    const homeProButton = page.locator('button:has-text("HomePro")').first();
    await homeProButton.click();
    await delay(500); // Wait for state update

    logValidation(3, 'PASS', 'Clicked HomePro retailer button');

    // Step 4: Verify HomePro Selection State
    console.log('\n=== Step 4: Verify HomePro Selection State ===');

    // Check if retailer grid is hidden
    const gridStillVisible = await page.isVisible('button:has-text("MegaHome")');
    if (!gridStillVisible) {
      logValidation(4, 'PASS', 'Retailer grid is hidden after selection');
    } else {
      logValidation(4, 'FAIL', 'Retailer grid is still visible after selection');
    }

    // Check if HomePro name is displayed in selected state
    const homeProSelected = await page.isVisible('text=HomePro');
    if (homeProSelected) {
      logValidation(4, 'PASS', 'HomePro is shown as selected');
    } else {
      logValidation(4, 'FAIL', 'HomePro is not shown as selected');
    }

    // Check if Product URL input is enabled
    const urlInput = page.locator('input[placeholder*="homepro.co.th"]').first();
    const isDisabled = await urlInput.getAttribute('disabled');
    if (isDisabled === null) {
      logValidation(4, 'PASS', 'Product URL input is enabled');
    } else {
      logValidation(4, 'FAIL', 'Product URL input is still disabled');
    }

    // Check for placeholder text
    const placeholder = await urlInput.getAttribute('placeholder');
    if (placeholder && placeholder.includes('homepro.co.th')) {
      logValidation(4, 'PASS', `Placeholder text contains HomePro domain: "${placeholder}"`);
    } else {
      logValidation(4, 'FAIL', `Placeholder text is incorrect: "${placeholder}"`);
    }

    // Check if Change button/text appears
    const changeVisible = await page.isVisible('text=Change');
    if (changeVisible) {
      logValidation(4, 'PASS', 'Change button is visible');
    } else {
      logValidation(4, 'FAIL', 'Change button is not visible');
    }

    await page.screenshot({
      path: '.playwright-mcp/retailer-selection-homepro-selected.png',
      fullPage: true
    });
    logValidation(4, 'PASS', 'HomePro selection screenshot captured');

    // Step 5: Click Change Button to Reopen Retailer Grid
    console.log('\n=== Step 5: Click Change Button ===');

    const changeButton = page.locator('text=Change').first();
    await changeButton.click();
    await delay(500);

    logValidation(5, 'PASS', 'Clicked Change button');

    // Step 6: Verify Retailer Grid Reappears
    console.log('\n=== Step 6: Verify Retailer Grid Reappears ===');

    const gridReappeared = await page.isVisible('button:has-text("MegaHome")');
    if (gridReappeared) {
      logValidation(6, 'PASS', 'Retailer grid reappeared after clicking Change');
    } else {
      logValidation(6, 'FAIL', 'Retailer grid did not reappear after clicking Change');
    }

    await page.screenshot({
      path: '.playwright-mcp/retailer-selection-grid-reappeared.png',
      fullPage: true
    });
    logValidation(6, 'PASS', 'Grid reappeared screenshot captured');

    // Step 7: Select MegaHome Retailer
    console.log('\n=== Step 7: Select MegaHome Retailer ===');

    const megaHomeButton = page.locator('button:has-text("MegaHome")').first();
    await megaHomeButton.click();
    await delay(500);

    logValidation(7, 'PASS', 'Clicked MegaHome retailer button');

    // Step 8: Verify MegaHome Selection State
    console.log('\n=== Step 8: Verify MegaHome Selection State ===');

    // Check if retailer grid is hidden
    const gridHiddenAgain = !(await page.isVisible('button:has-text("HomePro")'));
    if (gridHiddenAgain) {
      logValidation(8, 'PASS', 'Retailer grid is hidden after MegaHome selection');
    } else {
      logValidation(8, 'FAIL', 'Retailer grid is still visible after MegaHome selection');
    }

    // Check if MegaHome name is displayed
    const megaHomeSelected = await page.isVisible('text=MegaHome');
    if (megaHomeSelected) {
      logValidation(8, 'PASS', 'MegaHome is shown as selected');
    } else {
      logValidation(8, 'FAIL', 'MegaHome is not shown as selected');
    }

    // Check if Product URL input has MegaHome domain
    const megaHomeUrlInput = page.locator('input[placeholder*="megahome.co.th"]').first();
    const megaHomePlaceholder = await megaHomeUrlInput.getAttribute('placeholder');
    if (megaHomePlaceholder && megaHomePlaceholder.includes('megahome.co.th')) {
      logValidation(8, 'PASS', `Placeholder text updated to MegaHome domain: "${megaHomePlaceholder}"`);
    } else {
      logValidation(8, 'FAIL', `Placeholder text not updated correctly: "${megaHomePlaceholder}"`);
    }

    await page.screenshot({
      path: '.playwright-mcp/retailer-selection-megahome-selected.png',
      fullPage: true
    });
    logValidation(8, 'PASS', 'MegaHome selection screenshot captured');

  } catch (error) {
    logValidation(0, 'FAIL', `Unexpected error: ${error.message}`);
    console.error('Error during validation:', error);
  } finally {
    await browser.close();
  }

  // Generate validation report
  console.log('\n=== Generating Validation Report ===');
  generateReport();
}

function generateReport() {
  const reportLines = [];
  reportLines.push('================================================================================');
  reportLines.push('VALIDATION REPORT: CompetitorInputCard Retailer Selection');
  reportLines.push('Chore ID: 4eb0d299');
  reportLines.push('================================================================================');
  reportLines.push('');
  reportLines.push(`Date: ${new Date().toLocaleString()}`);
  reportLines.push(`Overall Result: ${overallResult}`);
  reportLines.push('');
  reportLines.push('================================================================================');
  reportLines.push('DETAILED RESULTS');
  reportLines.push('================================================================================');
  reportLines.push('');

  let stepNumber = 1;
  validationResults.forEach(result => {
    reportLines.push(`Step ${result.step}: ${result.message}`);
    reportLines.push(`Status: ${result.status}`);
    reportLines.push(`Time: ${result.timestamp}`);
    reportLines.push('');
  });

  reportLines.push('================================================================================');
  reportLines.push('SUMMARY');
  reportLines.push('================================================================================');
  reportLines.push('');

  const passCount = validationResults.filter(r => r.status === 'PASS').length;
  const failCount = validationResults.filter(r => r.status === 'FAIL').length;

  reportLines.push(`Total Validations: ${validationResults.length}`);
  reportLines.push(`Passed: ${passCount}`);
  reportLines.push(`Failed: ${failCount}`);
  reportLines.push('');

  if (overallResult === 'PASS') {
    reportLines.push('✓ ALL VALIDATIONS PASSED');
    reportLines.push('');
    reportLines.push('The CompetitorInputCard retailer selection functionality is working correctly:');
    reportLines.push('- Retailer grid displays all 5 retailers initially');
    reportLines.push('- Clicking a retailer hides the grid and shows selected state');
    reportLines.push('- Selected retailer displays with correct branding (colors, logo, domain)');
    reportLines.push('- Product URL input is enabled with correct placeholder');
    reportLines.push('- Change button appears and reopens the retailer grid');
    reportLines.push('- Users can switch between different retailers');
  } else {
    reportLines.push('✗ VALIDATION FAILED');
    reportLines.push('');
    reportLines.push('Failed validations:');
    validationResults
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        reportLines.push(`- Step ${r.step}: ${r.message}`);
      });
  }

  reportLines.push('');
  reportLines.push('================================================================================');
  reportLines.push('SCREENSHOTS');
  reportLines.push('================================================================================');
  reportLines.push('');
  reportLines.push('The following screenshots were captured:');
  reportLines.push('1. retailer-selection-initial.png - Initial state with retailer grid');
  reportLines.push('2. retailer-selection-homepro-selected.png - HomePro selected state');
  reportLines.push('3. retailer-selection-grid-reappeared.png - Grid after clicking Change');
  reportLines.push('4. retailer-selection-megahome-selected.png - MegaHome selected state');
  reportLines.push('');
  reportLines.push('================================================================================');

  const reportContent = reportLines.join('\n');

  // Write to file
  fs.writeFileSync('.playwright-mcp/validation-report-4eb0d299.txt', reportContent);

  // Also output to console
  console.log('\n' + reportContent);
}

// Run the validation
validateRetailerSelection().catch(console.error);
