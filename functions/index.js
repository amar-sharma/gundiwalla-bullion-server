/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const fs = require("fs");
const path = require("path");

// Firebase Functions v2 automatically loads .env files
// No need to manually call dotenv.config()

// Initialize Firebase Admin
// If you are running the functions locally, you need to initialize the app with the service account key.
if (process.env.FIREBASE_ADMIN_KEY) {
	let serviceAccount;

	// Check if FIREBASE_ADMIN_KEY is a file path or JSON string
	if (process.env.FIREBASE_ADMIN_KEY.startsWith('/') || process.env.FIREBASE_ADMIN_KEY.startsWith('./')) {
		// It's a file path - read the file
		const keyPath = path.resolve(process.env.FIREBASE_ADMIN_KEY);
		serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
	} else {
		// It's a JSON string - parse it directly
		serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);
	}

	initializeApp({
		credential: cert(serviceAccount),
	});
} else {
	// For emulator or deployed environment
	initializeApp();
}


const db = getFirestore("bullion");

// Scheduled function to update ticker data (runs every second)


const makeRequestToGetBullionRates = async (url) => {
	console.log("Fetching data from", url);
	const response = await fetch(url, {
		"headers": {
			"accept": "application/json, text/plain, */*",
			"accept-language": "en-US,en;q=0.9",
			"cache-control": "no-cache",
			"pragma": "no-cache",
			"priority": "u=1, i",
			"sec-ch-ua": '"Chromium\";v=\"141\", \"Not?A_Brand\";v=\"8\"',
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": '"macOS"',
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "cross-site",
			"Referer": "https://mcxlive.in/"
		},
		"body": null,
		"method": "GET"
	});

	if (!response.ok) {
		logger.error(`HTTP error! status: ${response.status}`);
		return;
	}

	return response.json();
}


exports.updateBullionRates = onSchedule(
	{
		schedule: "*/9 3-18 * * 1-6",
		timeZone: "UTC",
		region: "asia-south1",
		memory: "512MiB",
		timeoutSeconds: 540,
	},
	async (event) => {
		// IF time is not between 9AM IST and 11:30 IST, return
		const now = new Date();
		const istTime = new Date(now.toLocaleString("en-US", {
			timeZone: "Asia/Kolkata",
		}));
		const istHour = istTime.getHours();
		const istMinute = istTime.getMinutes();
		console.log({ istHour, istMinute });
		if (istHour < 9 || istHour > 23 || (istHour === 23 && istMinute > 30)) {
			console.log("Not between 9AM and 11:30 IST");
			return;
		}

		let lastRates = {}
		const collectionRef = db.collection("ticker").doc("data");
		const interval = setInterval(async () => {
			try {
				const requests = [makeRequestToGetBullionRates("https://liveapi.uk/com/ml-spot/index.php"), makeRequestToGetBullionRates("https://liveapi.uk/com/ml/index.php")];
				const [spotData, allData] = await Promise.all(requests);
				const goldData = allData.find(item => item.symb === 'GOLD');
				const silverData = allData.find(item => item.symb === 'SILVER');
				const spotGoldData = spotData.find(item => item.symb === 'SPOTGold');
				const spotSilverData = spotData.find(item => item.symb === 'SPOTSilver');
				const usdInrData = spotData.find(item => item.symb === 'USDINR');

				if (!goldData || !silverData || !spotGoldData || !spotSilverData || !usdInrData) {
					logger.error("Invalid data received");
					return;
				}

				const newRates = {
					gold_rates: {
						buy: parseFloat(goldData.buy),
						sell: parseFloat(goldData.sell),
						chg: parseFloat(goldData.chg),
						rate: parseFloat(goldData.rate),
					},
					silver_rates: {
						buy: parseFloat(silverData.buy),
						sell: parseFloat(silverData.sell),
						chg: parseFloat(silverData.chg),
						rate: parseFloat(silverData.rate),
					},
					spot_gold_rates: {
						buy: parseFloat(spotGoldData.buy),
						sell: parseFloat(spotGoldData.sell),
						chg: parseFloat(spotGoldData.chg),
						rate: parseFloat(spotGoldData.rate),
					},
					spot_silver_rates: {
						buy: parseFloat(spotSilverData.buy),
						sell: parseFloat(spotSilverData.sell),
						chg: parseFloat(spotSilverData.chg),
						rate: parseFloat(spotSilverData.rate),
					},
					usd_inr: {
						buy: parseFloat(usdInrData.buy),
						sell: parseFloat(usdInrData.sell),
						chg: parseFloat(usdInrData.chg),
						rate: parseFloat(usdInrData.rate),
					},
				};

				if (JSON.stringify(lastRates) !== JSON.stringify(newRates)) {
					await collectionRef.set(newRates);
					lastRates = newRates;
					logger.info("Bullion data updated successfully.");
				} else {
					logger.info("No change in bullion data. Skipping update.");
				}
			} catch (error) {
				logger.error("Error updating bullion data:", error);
			}
		}, 3000);

		// Stop the interval when the function is about to timeout.
		// The timeout is 3600s, we stop it a bit before that.
		setTimeout(() => clearInterval(interval), 539 * 1000);
	},
);

exports.getUsers = onCall({ region: "asia-south1" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
	}

	try {
		const listUsersResult = await getAuth().listUsers(1000);
		return listUsersResult.users.map(user => ({
			uid: user.uid,
			email: user.email,
			displayName: user.displayName,
			phoneNumber: user.phoneNumber,
			metadata: user.metadata,
		}));
	} catch (error) {
		console.error('Error listing users:', error);
		throw new HttpsError('internal', 'Error listing users');
	}
});

exports.createUser = onCall({ region: "asia-south1" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
	}

	const { displayName, phoneNumber, password, email } = request.data;

	console.log({ displayName, phoneNumber, password, email });

	try {
		const userRecord = await getAuth().createUser({
			email: email || undefined,
			phoneNumber: phoneNumber,
			password: password || 'password123', // Default password if not provided
			displayName: displayName,
		});

		await getAuth().setCustomUserClaims(userRecord.uid, { userAllowed: true });

		return {
			uid: userRecord.uid,
			displayName: userRecord.displayName,
			phoneNumber: userRecord.phoneNumber,
		};
	} catch (error) {
		console.error('Error creating user:', error);
		throw new HttpsError('internal', error.message);
	}
});

exports.deleteUser = onCall({ region: "asia-south1" }, async (request) => {
	if (!request.auth) {
		throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
	}

	const { uid } = request.data;
	if (!uid) {
		throw new HttpsError('invalid-argument', 'The function must be called with a uid.');
	}

	try {
		await getAuth().deleteUser(uid);
		return { success: true };
	} catch (error) {
		console.error('Error deleting user:', error);
		throw new HttpsError('internal', error.message);
	}
});
