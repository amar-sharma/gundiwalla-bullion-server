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
const db = getFirestore();

// Simulate websocket data generator
function generateMockTickerData() {
	// Generate random rates with some variation
	const goldBuy = Math.floor(Math.random() * 12500) + 5500; // 5500-6000 range
	const goldSell = goldBuy + Math.floor(Math.random() * 12500) + 10; // buy + 10-30
	const silverBuy = Math.floor(Math.random() * 12500) + 70000; // 70000-70200 range
	const silverSell = silverBuy + Math.floor(Math.random() * 12500) + 50; // buy + 50-100

	return {
		gold_rate: {
			buy: goldBuy,
			sell: goldSell,
		},
		silver_rate: {
			buy: silverBuy,
			sell: silverSell,
		},
		updated_at: new Date().toISOString(),
	};
}

// Scheduled function to update ticker data (runs every second)
exports.updateTickerData = onSchedule(
	{
		schedule: "every 1 seconds",
		timeZone: "UTC",
		memory: "128MiB",
	},
	async (event) => {
		try {
			logger.info("Updating ticker data from simulated websocket...");

			// Generate mock websocket data
			const tickerData = generateMockTickerData();

			// Update Firestore document at "ticker/data"
			await db.collection("ticker").doc("data").set(tickerData, { merge: true });

			logger.info("Ticker data updated successfully", {
				gold_buy: tickerData.gold_rate.buy,
				gold_sell: tickerData.gold_rate.sell,
				silver_buy: tickerData.silver_rate.buy,
				silver_sell: tickerData.silver_rate.sell,
			});
		} catch (error) {
			logger.error("Error updating ticker data:", error);
			throw error;
		}
	},
);

// Future function for actual websocket connection
// Uncomment and modify when ready to integrate real websocket
/*
const WebSocket = require('ws');

async function connectWebSocketAndUpdate() {
	const ws = new WebSocket('your-websocket-url');
  
	ws.on('message', async (data) => {
		try {
			const tickerData = JSON.parse(data);
		  
			// Validate data structure
			if (tickerData.gold_rate && tickerData.silver_rate) {
				tickerData.updated_at = new Date().toISOString();
				await db.collection("ticker").doc("data").set(tickerData, {merge: true});
				logger.info("Ticker data updated from websocket");
			}
		} catch (error) {
			logger.error("Error processing websocket message:", error);
		}
	});
  
	ws.on('error', (error) => {
		logger.error("WebSocket error:", error);
	});
}
*/
