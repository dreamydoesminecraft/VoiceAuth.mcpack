// YouTuber/Streamer verification tracker for VoiceAuth
// Logs verified content creators and resets monthly

import { world, system } from "@minecraft/server";

const CONTENT_CREATORS_FILE = "content_creators_log.json";
const RESET_DAY = 1; // Reset on 1st of month

/**
 * Get the monthly tracking data from world scoreboard
 */
function getCreatorData() {
    try {
        const obj = world.getDynamicProperty("voiceauth_creators");
        return obj ? JSON.parse(obj) : { creators: [], lastReset: Date.now() };
    } catch (e) {
        return { creators: [], lastReset: Date.now() };
    }
}

/**
 * Save creator data to world
 */
function saveCreatorData(data) {
    try {
        world.setDynamicProperty("voiceauth_creators", JSON.stringify(data));
    } catch (e) {
        console.error("[VoiceAuth] Failed to save creator data:", e);
    }
}

/**
 * Add verified YouTuber/Streamer to the log
 */
export function logContentCreator(uuid, playerName, platform = "minecraft") {
    try {
        const data = getCreatorData();
        
        const existing = data.creators.find(c => c.uuid === uuid);
        if (existing) {
            existing.lastVerified = Date.now();
            existing.verifyCount = (existing.verifyCount || 1) + 1;
        } else {
            data.creators.push({
                uuid,
                playerName,
                platform,
                firstVerified: Date.now(),
                lastVerified: Date.now(),
                verifyCount: 1
            });
        }
        
        saveCreatorData(data);
        console.warn(`[VoiceAuth] Logged creator: ${playerName} (${uuid})`);
        return true;
    } catch (e) {
        console.error("[VoiceAuth] Error logging creator:", e);
        return false;
    }
}

/**
 * Check if we need to do monthly reset
 */
function shouldResetMonth() {
    const data = getCreatorData();
    const lastReset = new Date(data.lastReset);
    const today = new Date();
    
    return today.getDate() === RESET_DAY && lastReset.getMonth() !== today.getMonth();
}

/**
 * Reset monthly tracker
 */
function resetMonthly() {
    try {
        const data = getCreatorData();
        const resetData = {
            creators: [],
            lastReset: Date.now(),
            previousMonth: {
                date: new Date().toISOString(),
                totalCreators: data.creators.length,
                creators: data.creators
            }
        };
        saveCreatorData(resetData);
        
        console.warn(`[VoiceAuth] Monthly reset completed. Tracked ${data.creators.length} creators.`);
        return data.creators;
    } catch (e) {
        console.error("[VoiceAuth] Monthly reset failed:", e);
        return [];
    }
}

/**
 * Get all verified creators for this month
 */
export function getVerifiedCreators() {
    const data = getCreatorData();
    return data.creators || [];
}

/**
 * Export creators data as JSON
 */
export function exportCreatorsData() {
    return getCreatorData();
}

/**
 * Run monthly reset check
 */
system.runInterval(() => {
    if (shouldResetMonth()) {
        const lastMonth = resetMonthly();
        console.warn(`[VoiceAuth] Monthly creators summary: ${lastMonth.length} verified`);
    }
}, 72000); // Check every hour (72000 ticks = 1 hour)

export { getCreatorData, saveCreatorData };
