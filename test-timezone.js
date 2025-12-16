// Quick test to verify timezone conversion is working
import { convertUTCToTimezone } from "./utils/timezoneHelper.js";

console.log("Testing timezone conversion:");

// Test case: UTC time 12:00:00, GST +04:00 should be 16:00:00
const now = new Date('2025-12-16T12:00:00Z'); // UTC
const gstTime = convertUTCToTimezone(now, '+04:00');
console.log('UTC:', now.toISOString());
console.log('GST (+04:00):', gstTime);
console.log('Expected: 2025-12-16 16:00:00');

// Test case: UTC 08:00:00, PKT +05:00 should be 13:00:00
const pktTime = convertUTCToTimezone(new Date('2025-12-16T08:00:00Z'), '+05:00');
console.log('\nUTC:', new Date('2025-12-16T08:00:00Z').toISOString());
console.log('PKT (+05:00):', pktTime);
console.log('Expected: 2025-12-16 13:00:00');

// Test case: UTC 20:00:00, EST -05:00 should be 15:00:00
const estTime = convertUTCToTimezone(new Date('2025-12-16T20:00:00Z'), '-05:00');
console.log('\nUTC:', new Date('2025-12-16T20:00:00Z').toISOString());
console.log('EST (-05:00):', estTime);
console.log('Expected: 2025-12-16 15:00:00');
