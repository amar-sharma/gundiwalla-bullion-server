#!/usr/bin/env node

/**
 * Script to make a user admin
 * Usage: node makeAdmin.js <uid>
 * 
 * Make sure FIREBASE_ADMIN_KEY environment variable is set to the path of your service account JSON
 * Example: FIREBASE_ADMIN_KEY=./serviceAccountKey.json node makeAdmin.js yhUgkGSnKZdE7LlkyFWEaJDzcF93
 */

// Load environment variables from .env file
// Wrap in try-catch to handle missing or malformed .env files gracefully


const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

try {
	dotenv.config();
} catch (error) {
	console.warn("Failed to load .env file:", error.message);
}

// Get UID from command line arguments
const uid = process.argv[2];

if (!uid) {
	console.error('❌ Error: Please provide a user UID as an argument');
	console.log('Usage: node makeAdmin.js <uid>');
	console.log('Example: node makeAdmin.js yhUgkGSnKZdE7LlkyFWEaJDzcF93');
	process.exit(1);
}

// Check if FIREBASE_ADMIN_KEY is set
if (!process.env.FIREBASE_ADMIN_KEY) {
	console.error('❌ Error: FIREBASE_ADMIN_KEY environment variable is not set');
	console.log('Please set it to the path of your service account JSON file');
	console.log('Example: FIREBASE_ADMIN_KEY=./serviceAccountKey.json node makeAdmin.js <uid>');
	process.exit(1);
}

// Initialize Firebase Admin
let serviceAccount;

try {
	// Check if FIREBASE_ADMIN_KEY is a file path or JSON string
	if (process.env.FIREBASE_ADMIN_KEY.startsWith('/') || process.env.FIREBASE_ADMIN_KEY.startsWith('./')) {
		// It's a file path - read the file
		const keyPath = path.resolve(process.env.FIREBASE_ADMIN_KEY);

		if (!fs.existsSync(keyPath)) {
			console.error(`❌ Error: Service account key file not found at: ${keyPath}`);
			process.exit(1);
		}

		serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
	} else {
		// It's a JSON string - parse it directly
		serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
	}

	initializeApp({
		credential: cert(serviceAccount),
	});

	console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
	console.error('❌ Error initializing Firebase Admin:', error.message);
	process.exit(1);
}

// Make user admin
async function makeAdmin(uid) {
	try {
		// First, verify the user exists
		const user = await getAuth().getUser(uid);
		console.log(`\n📋 User found:`);
		console.log(`   UID: ${user.uid}`);
		console.log(`   Display Name: ${user.displayName || 'N/A'}`);
		console.log(`   Email: ${user.email || 'N/A'}`);
		console.log(`   Phone: ${user.phoneNumber || 'N/A'}`);

		// Check current claims
		const currentClaims = user.customClaims || {};
		console.log(`\n🔍 Current custom claims:`, currentClaims);

		// Set admin claim
		await getAuth().setCustomUserClaims(uid, {
			...currentClaims,
			admin: true
		});

		console.log(`\n✅ Successfully set admin claim for user: ${uid}`);
		console.log(`\n💡 Note: The user will need to sign out and sign in again for the new claims to take effect.`);

		process.exit(0);
	} catch (error) {
		console.error(`\n❌ Error making user admin:`, error.message);

		if (error.code === 'auth/user-not-found') {
			console.log('\n💡 The user with this UID does not exist. Please check the UID and try again.');
		}

		process.exit(1);
	}
}

// Run the function
makeAdmin(uid);
