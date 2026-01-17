#!/usr/bin/env node

/**
 * CLI Test Script for Content Moderation
 * Usage: node moderation/test-moderation.js [examples.txt]
 */

// Load environment variables from backend root
const path = require('path');
const fs = require('fs');

// Try to load dotenv (optional - will work without it)
let dotenv;
try {
  dotenv = require('dotenv');
} catch (e) {
  // dotenv not available, that's okay - we'll work without it
  dotenv = null;
}

// Load .env file if dotenv is available
if (dotenv) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config(); // Fallback to default .env location
  }
}

const contentModerator = require('./index');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

async function testModeration() {
  const examplesFile = process.argv[2] || path.join(__dirname, 'examples.txt');
  
  console.log(colorize('\n🧪 Content Moderation Test Suite\n', 'cyan'));
  console.log(colorize(`Reading examples from: ${examplesFile}\n`, 'gray'));

  if (!fs.existsSync(examplesFile)) {
    console.error(colorize(`❌ Error: File not found: ${examplesFile}`, 'red'));
    console.log(colorize('\n💡 Tip: Create examples.txt with format:', 'yellow'));
    console.log(colorize('   EXPECTED_RESULT|MESSAGE_TEXT', 'gray'));
    process.exit(1);
  }

  const content = fs.readFileSync(examplesFile, 'utf-8');
  const lines = content.split('\n');
  
  const tests = [];
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse format: EXPECTED_RESULT|MESSAGE_TEXT
    const parts = trimmed.split('|');
    if (parts.length < 2) {
      console.warn(colorize(`⚠️  Skipping invalid line ${lineNumber}: ${trimmed}`, 'yellow'));
      continue;
    }

    const expected = parts[0].trim().toUpperCase();
    const message = parts.slice(1).join('|').trim(); // Rejoin in case message contains |

    if (!['BLOCK', 'FLAG', 'ALLOW'].includes(expected)) {
      console.warn(colorize(`⚠️  Invalid expected result on line ${lineNumber}: ${expected}`, 'yellow'));
      continue;
    }

    tests.push({
      lineNumber,
      expected,
      message,
      expectedAllowed: expected === 'ALLOW'
    });
  }

  if (tests.length === 0) {
    console.error(colorize('❌ No valid test cases found!', 'red'));
    process.exit(1);
  }

  console.log(colorize(`Found ${tests.length} test cases\n`, 'blue'));
  console.log(colorize('─'.repeat(80), 'gray'));

  const results = {
    total: tests.length,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // Note: AI moderation now uses local inference - no API key needed
  console.log(colorize('\n✅ Using local AI model inference (no API key required).\n', 'green'));

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    const testNum = `[${i + 1}/${tests.length}]`;
    
    try {
      // Use unique user ID for each test to avoid repetition detection false positives
      const testUserId = `test-user-${i}`;
      
      // Run moderation
      const result = await contentModerator.moderate(
        test.message,
        testUserId,
        'city'
      );

      const actualAllowed = result.allowed;
      const actualDecision = result.decision;
      const passed = actualAllowed === test.expectedAllowed;

      // Display result
      console.log(`\n${testNum} ${colorize(test.expected, test.expectedAllowed ? 'green' : 'red')} | ${colorize(actualDecision, actualAllowed ? 'green' : 'red')}`);
      console.log(colorize(`   Message: "${test.message.substring(0, 60)}${test.message.length > 60 ? '...' : ''}"`, 'gray'));
      
      if (result.flags.length > 0) {
        console.log(colorize(`   Flags: ${result.flags.join(', ')}`, 'yellow'));
      }
      
      if (result.reason) {
        console.log(colorize(`   Reason: ${result.reason}`, 'cyan'));
      }

      if (result.sources.ai) {
        console.log(colorize(`   AI Confidence: ${(result.confidence * 100).toFixed(1)}%`, 'blue'));
      }

      if (passed) {
        results.passed++;
        console.log(colorize('   ✅ PASS', 'green'));
      } else {
        results.failed++;
        console.log(colorize(`   ❌ FAIL - Expected ${test.expected} but got ${actualDecision}`, 'red'));
      }

      // Small delay to avoid rate limiting
      if (i < tests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error) {
      results.skipped++;
      console.log(`\n${testNum} ${colorize('ERROR', 'red')}`);
      console.log(colorize(`   Message: "${test.message}"`, 'gray'));
      console.log(colorize(`   Error: ${error.message}`, 'red'));
    }
  }

  // Summary
  console.log(colorize('\n' + '─'.repeat(80), 'gray'));
  console.log(colorize('\n📊 Test Summary\n', 'cyan'));
  console.log(`   Total:  ${results.total}`);
  console.log(colorize(`   Passed: ${results.passed}`, 'green'));
  console.log(colorize(`   Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green'));
  console.log(colorize(`   Skipped: ${results.skipped}`, results.skipped > 0 ? 'yellow' : 'gray'));

  const successRate = ((results.passed / results.total) * 100).toFixed(1);
  console.log(colorize(`\n   Success Rate: ${successRate}%\n`, successRate >= 80 ? 'green' : 'yellow'));

  // Exit code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
testModeration().catch(error => {
  console.error(colorize('\n❌ Fatal Error:', 'red'));
  console.error(error);
  process.exit(1);
});
