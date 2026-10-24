import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IN_MEMORY_SUITES = [
  { name: 'testModels.js', script: path.join(__dirname, 'testModels.js'), desc: 'Mongoose schema validation rules' },
  { name: 'testAuth.js', script: path.join(__dirname, 'testAuth.js'), desc: 'Staff auth, JWT & rate limiting' },
  { name: 'testLostItems.js', script: path.join(__dirname, 'testLostItems.js'), desc: 'LostItem CRUD & dual-audience projections' },
  { name: 'testFoundItems.js', script: path.join(__dirname, 'testFoundItems.js'), desc: 'FoundItem CRUD, status immutability & 409 guard' },
  { name: 'testClaims.js', script: path.join(__dirname, 'testClaims.js'), desc: 'Claim workflow, INV-1/2/3 & FAIL_WRITE recovery' },
  { name: 'testLifecycle.js', script: path.join(__dirname, 'testLifecycle.js'), desc: 'Full cross-module integration scenario' }
];

const LIVE_DB_SUITES = [
  { name: 'testLiveDb.js', script: path.join(__dirname, 'testLiveDb.js'), desc: 'Real MongoDB integration (foundit_test)' }
];

/**
 * Runs a single test suite script in an isolated child process.
 * @param {object} suite
 * @returns {Promise<object>}
 */
function runSuite(suite) {
  return new Promise((resolve) => {
    let stdoutData = '';
    let stderrData = '';

    const child = fork(suite.script, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: { ...process.env, NODE_ENV: 'test' }
    });

    child.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    child.on('close', (code) => {
      const isSkipped = stdoutData.includes('(SKIPPED)') || stdoutData.includes('[SKIPPED]');

      // Parse actual assertion counts if reliably formatted
      // Matches e.g. "Results: 27 PASSED, 0 FAILED"
      const match = stdoutData.match(/(?:[A-Za-z0-9 ]+Results:)?\s*(\d+)\s+PASSED,\s+(\d+)\s+FAILED/i);
      let passedAssertions = 'N/A';
      let failedAssertions = 'N/A';

      if (match) {
        passedAssertions = parseInt(match[1], 10);
        failedAssertions = parseInt(match[2], 10);
      }

      let status = 'PASS';
      if (isSkipped && code === 0) {
        status = 'SKIPPED';
      } else if (code !== 0 || (typeof failedAssertions === 'number' && failedAssertions > 0)) {
        status = 'FAIL';
      }

      resolve({
        name: suite.name,
        desc: suite.desc,
        code,
        status,
        passedAssertions,
        failedAssertions,
        stdout: stdoutData,
        stderr: stderrData
      });
    });
  });
}

async function runAll() {
  console.log('====================================================================================================');
  console.log('                                 FOUNDIT AUTOMATED API TEST RUNNER');
  console.log('====================================================================================================');

  console.log('\n[Runner] Executing Part A: In-Memory Isolated Driver Suites...');
  const inMemoryResults = [];
  for (const suite of IN_MEMORY_SUITES) {
    process.stdout.write(`  Running ${suite.name}... `);
    const res = await runSuite(suite);
    console.log(`${res.status} (exit code ${res.code})`);
    inMemoryResults.push(res);
  }

  console.log('\n[Runner] Executing Part B: Real MongoDB Integration Suite...');
  const liveResults = [];
  for (const suite of LIVE_DB_SUITES) {
    process.stdout.write(`  Running ${suite.name}... `);
    const res = await runSuite(suite);
    console.log(`${res.status} (exit code ${res.code})`);
    liveResults.push(res);
  }

  // Formatting and Summary Table
  console.log('\n====================================================================================================');
  console.log('                                FOUNDIT API TEST EXECUTION REPORT');
  console.log('====================================================================================================');
  console.log('PART A: IN-MEMORY ISOLATED DRIVER SUITES (TD-1 to TD-6 Isolation)');
  console.log('----------------------------------------------------------------------------------------------------');
  console.log(
    'Suite Name'.padEnd(28) + ' | ' +
    'Assertions Passed'.padStart(17) + ' | ' +
    'Assertions Failed'.padStart(17) + ' | ' +
    'Exit Code'.padStart(9) + ' | ' +
    'Status'.padEnd(8)
  );
  console.log('----------------------------------------------------------------------------------------------------');

  let inMemoryTotalPassed = 0;
  let inMemoryTotalFailed = 0;
  let hasNA = false;
  let inMemorySuitesPassed = 0;
  let inMemorySuitesFailed = 0;

  for (const r of inMemoryResults) {
    const passedStr = String(r.passedAssertions).padStart(17);
    const failedStr = String(r.failedAssertions).padStart(17);
    const exitStr = String(r.code).padStart(9);
    const statusStr = r.status.padEnd(8);

    console.log(`${r.name.padEnd(28)} | ${passedStr} | ${failedStr} | ${exitStr} | ${statusStr}`);

    if (typeof r.passedAssertions === 'number') {
      inMemoryTotalPassed += r.passedAssertions;
    } else {
      hasNA = true;
    }

    if (typeof r.failedAssertions === 'number') {
      inMemoryTotalFailed += r.failedAssertions;
    }

    if (r.status === 'PASS') inMemorySuitesPassed++;
    else inMemorySuitesFailed++;
  }

  console.log('----------------------------------------------------------------------------------------------------');
  const subtotalPassedStr = hasNA ? `${inMemoryTotalPassed} + N/A` : String(inMemoryTotalPassed);
  console.log(
    'In-Memory Subtotal'.padEnd(28) + ' | ' +
    subtotalPassedStr.padStart(17) + ' | ' +
    String(inMemoryTotalFailed).padStart(17) + ' | ' +
    '-'.padStart(9) + ' | ' +
    (inMemorySuitesFailed === 0 ? 'ALL PASS' : 'FAILED')
  );

  console.log('\nPART B: REAL MONGODB INTEGRATION SUITE (foundit_test Target)');
  console.log('----------------------------------------------------------------------------------------------------');
  console.log(
    'Suite Name'.padEnd(28) + ' | ' +
    'Target Database'.padEnd(17) + ' | ' +
    'Assertions Passed'.padStart(17) + ' | ' +
    'Exit Code'.padStart(9) + ' | ' +
    'Status'.padEnd(8)
  );
  console.log('----------------------------------------------------------------------------------------------------');

  let liveSuitesPassed = 0;
  let liveSuitesFailed = 0;
  let liveSuitesSkipped = 0;

  for (const r of liveResults) {
    const passedStr = String(r.passedAssertions).padStart(17);
    const exitStr = String(r.code).padStart(9);
    const statusStr = r.status.padEnd(8);

    console.log(`${r.name.padEnd(28)} | ${'foundit_test'.padEnd(17)} | ${passedStr} | ${exitStr} | ${statusStr}`);

    if (r.status === 'PASS') liveSuitesPassed++;
    else if (r.status === 'SKIPPED') liveSuitesSkipped++;
    else liveSuitesFailed++;
  }

  console.log('----------------------------------------------------------------------------------------------------');
  if (liveSuitesSkipped > 0) {
    console.log('Live DB Status: SKIPPED (MONGODB_URI_TEST not set. Live MongoDB verification was NOT performed.)');
  } else if (liveSuitesFailed > 0) {
    console.log('Live DB Status: FAILED (Live MongoDB integration tests encountered failures.)');
  } else {
    console.log('Live DB Status: PASSED (Verified against real MongoDB database foundit_test.)');
  }

  const totalSuites = inMemoryResults.length + liveResults.length;
  const totalPassedSuites = inMemorySuitesPassed + liveSuitesPassed;
  const totalFailedSuites = inMemorySuitesFailed + liveSuitesFailed;
  const totalSkippedSuites = liveSuitesSkipped;

  console.log('====================================================================================================');
  console.log(
    `SUITE SUMMARY: ${totalSuites} Total | ${totalPassedSuites} Passed | ${totalFailedSuites} Failed | ${totalSkippedSuites} Skipped`
  );
  console.log(
    `ASSERTIONS (Reported): ${subtotalPassedStr} Passed | ${inMemoryTotalFailed} Failed`
  );

  if (totalFailedSuites > 0) {
    console.log('OVERALL RESULT: FAILED (One or more required suites failed)');
    console.log('====================================================================================================');
    process.exit(1);
  } else if (liveSuitesSkipped > 0) {
    console.log('OVERALL RESULT: ALL IN-MEMORY SUITES PASSED (LIVE DATABASE INTEGRATION SKIPPED)');
    console.log('====================================================================================================');
    process.exit(0);
  } else {
    console.log('OVERALL RESULT: ALL REQUIRED TEST SUITES PASSED (INCLUDING REAL MONGODB INTEGRATION)');
    console.log('====================================================================================================');
    process.exit(0);
  }
}

runAll();
