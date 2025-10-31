#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 *
 * This script validates that all required environment variables are set
 * and have valid values before deployment or development.
 *
 * Usage:
 *   node scripts/validate-env.js
 *   node scripts/validate-env.js --production
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Track errors and warnings
let errors = 0;
let warnings = 0;

// Check if running in production mode
const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

console.log(`${colors.cyan}🔍 ChurchConnect Environment Validation${colors.reset}`);
console.log(`${colors.cyan}==========================================${colors.reset}\n`);
console.log(`Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}\n`);

/**
 * Print success message
 */
function success(message) {
  console.log(`${colors.green}✓${colors.reset} ${message}`);
}

/**
 * Print error message
 */
function error(message) {
  console.log(`${colors.red}✗${colors.reset} ${message}`);
  errors++;
}

/**
 * Print warning message
 */
function warn(message) {
  console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
  warnings++;
}

/**
 * Print info message
 */
function info(message) {
  console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
}

/**
 * Check if a variable exists and is not a placeholder
 */
function checkVariable(name, options = {}) {
  const {
    required = true,
    pattern = null,
    placeholder = null,
    productionOnly = false,
  } = options;

  // Skip production-only checks in development
  if (productionOnly && !isProduction) {
    return true;
  }

  const value = process.env[name];

  // Check if variable exists
  if (!value) {
    if (required) {
      error(`${name} is not set`);
      return false;
    } else {
      warn(`${name} is not set (optional)`);
      return true;
    }
  }

  // Check if value is still a placeholder
  if (placeholder && value.includes(placeholder)) {
    error(`${name} contains placeholder value "${placeholder}"`);
    return false;
  }

  // Check common placeholders
  const commonPlaceholders = [
    'your-',
    'GENERATE',
    'placeholder',
    'example',
    'test-key',
  ];

  for (const ph of commonPlaceholders) {
    if (value.includes(ph)) {
      error(`${name} contains placeholder value "${ph}"`);
      return false;
    }
  }

  // Validate pattern if provided
  if (pattern && !pattern.test(value)) {
    error(`${name} has invalid format`);
    return false;
  }

  success(`${name} is set`);
  return true;
}

/**
 * Validate URL format
 */
function validateURL(name, required = true) {
  const value = process.env[name];

  if (!value) {
    if (required) {
      error(`${name} is not set`);
      return false;
    }
    return true;
  }

  try {
    const url = new URL(value);

    // Check protocol
    if (!['http:', 'https:'].includes(url.protocol)) {
      error(`${name} must use http:// or https:// protocol`);
      return false;
    }

    // Warn about http in production
    if (isProduction && url.protocol === 'http:') {
      warn(`${name} uses http:// in production (should use https://)`);
    }

    success(`${name} is a valid URL`);
    return true;
  } catch (err) {
    error(`${name} is not a valid URL: ${value}`);
    return false;
  }
}

/**
 * Validate database URL
 */
function validateDatabaseURL() {
  const name = 'DATABASE_URL';
  const value = process.env[name];

  if (!value) {
    error(`${name} is not set`);
    return false;
  }

  if (value.includes('user:password@localhost')) {
    error(`${name} contains placeholder credentials`);
    return false;
  }

  if (!value.startsWith('postgresql://') && !value.startsWith('postgres://')) {
    error(`${name} must start with postgresql:// or postgres://`);
    return false;
  }

  // Warn about localhost in production
  if (isProduction && value.includes('localhost')) {
    warn(`${name} uses localhost in production (should use remote database)`);
  }

  success(`${name} is set and valid`);
  return true;
}

/**
 * Validate Stripe keys match environment
 */
function validateStripeKeys() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  if (!secretKey || !publishableKey) {
    return; // Already checked in required variables
  }

  const secretIsTest = secretKey.startsWith('sk_test_');
  const publishableIsTest = publishableKey.startsWith('pk_test_');

  if (secretIsTest !== publishableIsTest) {
    error('Stripe keys mismatch: secret and publishable keys are from different environments');
    return false;
  }

  if (isProduction && secretIsTest) {
    error('Using Stripe test keys in production (should use live keys)');
    return false;
  }

  if (!isProduction && !secretIsTest) {
    warn('Using Stripe live keys in development (consider using test keys)');
  }

  success('Stripe keys match environment');
  return true;
}

/**
 * Main validation
 */
function validate() {
  console.log('1. Checking Database Configuration...\n');
  validateDatabaseURL();
  console.log('');

  console.log('2. Checking NextAuth Configuration...\n');
  checkVariable('NEXTAUTH_SECRET', {
    required: true,
    placeholder: 'your-secret-key',
  });
  checkVariable('NEXTAUTH_URL', { required: true });
  validateURL('NEXTAUTH_URL');
  console.log('');

  console.log('3. Checking Application URLs...\n');
  validateURL('NEXT_PUBLIC_WEB_URL');
  validateURL('NEXT_PUBLIC_API_URL');
  validateURL('NEXT_PUBLIC_PORTAL_URL');
  validateURL('NEXT_PUBLIC_ADMIN_URL');
  validateURL('NEXT_PUBLIC_GRAPHQL_URL');
  console.log('');

  console.log('4. Checking Cloudinary Configuration...\n');
  checkVariable('CLOUDINARY_CLOUD_NAME', { required: true });
  checkVariable('CLOUDINARY_API_KEY', { required: true });
  checkVariable('CLOUDINARY_API_SECRET', { required: true });
  console.log('');

  console.log('5. Checking Resend Email Configuration...\n');
  checkVariable('RESEND_API_KEY', {
    required: true,
    pattern: /^re_/,
  });
  checkVariable('EMAIL_FROM', { required: true });
  checkVariable('ADMIN_EMAIL', { required: true });
  console.log('');

  console.log('6. Checking reCAPTCHA Configuration...\n');
  checkVariable('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', { required: true });
  checkVariable('RECAPTCHA_SECRET_KEY', { required: true });
  console.log('');

  console.log('7. Checking Stripe Configuration...\n');
  checkVariable('STRIPE_SECRET_KEY', {
    required: true,
    pattern: /^sk_(test|live)_/,
  });
  checkVariable('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', {
    required: true,
    pattern: /^pk_(test|live)_/,
  });
  checkVariable('STRIPE_WEBHOOK_SECRET', {
    required: true,
    pattern: /^whsec_/,
  });
  validateStripeKeys();
  console.log('');

  console.log('8. Checking Optional Configuration...\n');
  checkVariable('SENTRY_DSN', {
    required: false,
    productionOnly: true,
  });
  checkVariable('SENTRY_ENVIRONMENT', {
    required: false,
  });
  console.log('');

  // Print summary
  console.log('=========================================\n');

  if (errors === 0 && warnings === 0) {
    console.log(`${colors.green}✅ All checks passed!${colors.reset}`);
    console.log(`${colors.green}Environment is properly configured.${colors.reset}\n`);
    process.exit(0);
  } else if (errors === 0) {
    console.log(`${colors.yellow}⚠️  ${warnings} warning(s) found${colors.reset}`);
    console.log(`${colors.yellow}Environment is configured but review warnings above.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ ${errors} error(s) and ${warnings} warning(s) found${colors.reset}`);
    console.log(`${colors.red}Please fix errors before proceeding.${colors.reset}\n`);

    info('Tips:');
    console.log('  - Copy .env.example to .env and fill in real values');
    console.log('  - Generate NEXTAUTH_SECRET with: openssl rand -base64 32');
    console.log('  - See docs/ENVIRONMENT_VARIABLES.md for detailed setup guide');
    console.log('');

    process.exit(1);
  }
}

// Load environment from .env file if it exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  info(`Loading environment from ${envPath}\n`);
  try {
    // Try to load dotenv if available
    require('dotenv').config({ path: envPath });
  } catch (err) {
    // If dotenv is not installed, read .env manually
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
  }
} else {
  warn(`No .env file found at ${envPath}`);
  warn('Checking system environment variables only\n');
}

// Run validation
validate();
