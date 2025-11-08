/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");

// Initialize Firebase Admin
initializeApp();
const db = getFirestore("bullion");

// Scheduled function to update ticker data (runs every second)

exports.updateBullionRates = onSchedule(
	{
		schedule: "*/9 3-18 * * *",
		timeZone: "UTC",
		memory: "128MiB",
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
		console.log(istHour, istMinute);
		if (istHour < 9 || istHour > 23 || (istHour === 23 && istMinute > 30)) {
			console.log("Not between 9AM and 11:30 IST");
			return;
		}

		let lastRates = {}
		const collectionRef = db.collection("ticker").doc("data");
		const interval = setInterval(async () => {
			try {
				const response = await fetch("https://liveapi.uk/com/ml/index.php", {
					"headers": {
						"accept": "application/json, text/plain, */*",
						"accept-language": "en-US,en;q=0.9",
						"cache-control": "no-cache",
						"pragma": "no-cache",
						"priority": "u=1, i",
						"sec-ch-ua": '"Chromium\";v=\"141\", \"Not?A_Brand\";v=\"8\"',
						"sec-ch-ua-mobile": "?0",
						"sec-ch-ua-platform": '"macOS\"',
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

				const data = await response.json();
				const goldData = data.find(item => item.symb === 'GOLD');
				const silverData = data.find(item => item.symb === 'SILVER');

				if (!goldData || !silverData) {
					logger.error("Invalid data received");
					return;
				}

				const newRates = {
					gold_rates: {
						buy: parseFloat(goldData.buy),
						sell: parseFloat(goldData.sell),
						chg: parseFloat(goldData.chg),
					},
					silver_rates: {
						buy: parseFloat(silverData.buy),
						sell: parseFloat(silverData.sell),
						chg: parseFloat(silverData.chg),
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
