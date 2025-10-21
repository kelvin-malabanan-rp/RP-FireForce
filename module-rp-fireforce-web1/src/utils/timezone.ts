// src/utils/timezone.ts - FIXED FOR UTC TIMESTAMPS

/**
 * Comprehensive timezone utilities for FireForce
 * Backend stores all timestamps in UTC (without Z indicator)
 * Frontend displays timestamps in user's selected timezone
 */

// Available timezones
export const TIMEZONES = {
    ATLANTA: 'America/New_York',      // UTC-5/-4 (EST/EDT)
    SPAIN: 'Europe/Madrid',           // UTC+1/+2 (CET/CEST)
    PHILIPPINES: 'Asia/Manila',       // UTC+8 (PHT)
    UTC: 'UTC'                        // UTC+0
} as const;

export type TimezoneKey = keyof typeof TIMEZONES;

export const timezoneOptions = [
    { value: 'America/New_York', label: 'Atlanta', shortLabel: 'EST/EDT', flag: '🇺🇸', offset: 'UTC-5/-4' },
    { value: 'Europe/Madrid', label: 'Spain', shortLabel: 'CET/CEST', flag: '🇪🇸', offset: 'UTC+1/+2' },
    { value: 'Asia/Manila', label: 'Philippines', shortLabel: 'PHT', flag: '🇵🇭', offset: 'UTC+8' },
    { value: 'UTC', label: 'UTC', shortLabel: 'UTC', flag: '🌐', offset: 'UTC+0' },
];

/**
 * Get user's preferred timezone from localStorage (defaults to Philippines)
 */
export const getUserTimezone = (): string => {
    return localStorage.getItem('userTimezone') || TIMEZONES.PHILIPPINES;
};

/**
 * Save user's timezone preference
 */
export const setUserTimezone = (timezone: string): void => {
    localStorage.setItem('userTimezone', timezone);
};

/**
 * Save timezone preference when user changes it
 */
export const saveTimezonePreference = (timezone: string): void => {
    localStorage.setItem('userTimezone', timezone);
    console.log(`🌐 Timezone preference saved: ${timezone}`);
};

/**
 * ✅ CRITICAL: Parse UTC timestamp string correctly
 * Backend returns: "2025-10-21 12:00:00" or "2025-10-21T12:00:00"
 * We need to ensure it's treated as UTC, not local time
 */
const parseUTCTimestamp = (timestamp: string | Date): Date => {
    if (timestamp instanceof Date) return timestamp;

    try {
        // Remove any existing timezone info
        let cleanTimestamp = timestamp.trim();

        // If it has a Z or timezone offset, parse directly
        if (cleanTimestamp.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(cleanTimestamp)) {
            return new Date(cleanTimestamp);
        }

        // ✅ CRITICAL FIX: Explicitly treat as UTC by adding 'Z'
        // Database format: "2025-10-21 12:00:00" or "2025-10-21T12:00:00"
        // Convert space to T if needed
        cleanTimestamp = cleanTimestamp.replace(' ', 'T');

        // Add Z to indicate UTC if not present
        if (!cleanTimestamp.endsWith('Z')) {
            cleanTimestamp += 'Z';
        }

        const date = new Date(cleanTimestamp);

        if (isNaN(date.getTime())) {
            console.error('❌ Invalid timestamp:', timestamp);
            return new Date(); // Fallback to current time
        }

        return date;
    } catch (error) {
        console.error('❌ Error parsing timestamp:', timestamp, error);
        return new Date(); // Fallback to current time
    }
};

/**
 * Format UTC timestamp in specified timezone (FULL FORMAT)
 * Example: "Oct 21, 2025, 08:00:00 PM PHT"
 */
export const formatInTimezone = (
    utcTimestamp: string | Date,
    timezone?: string
): string => {
    try {
        const date = parseUTCTimestamp(utcTimestamp); // ✅ Use proper UTC parser
        const tz = timezone || getUserTimezone();

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: tz,
            timeZoneName: 'short'
        });
    } catch (error) {
        console.error('❌ Error formatting timestamp:', utcTimestamp, error);
        return typeof utcTimestamp === 'string' ? utcTimestamp : utcTimestamp.toISOString();
    }
};

/**
 * Format UTC timestamp in specified timezone (SHORT FORMAT)
 * Example: "Oct 21, 08:00 PM"
 */
export const formatInTimezoneShort = (
    utcTimestamp: string | Date,
    timezone?: string
): string => {
    try {
        const date = parseUTCTimestamp(utcTimestamp); // ✅ Use proper UTC parser
        const tz = timezone || getUserTimezone();

        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: tz,
        });
    } catch (error) {
        console.error('❌ Error formatting timestamp:', utcTimestamp, error);
        return typeof utcTimestamp === 'string' ? utcTimestamp : utcTimestamp.toISOString();
    }
};

/**
 * Format UTC timestamp (DATE ONLY)
 * Example: "October 21, 2025"
 */
export const formatDateInTimezone = (
    utcTimestamp: string | Date,
    timezone?: string
): string => {
    try {
        const date = parseUTCTimestamp(utcTimestamp); // ✅ Use proper UTC parser
        const tz = timezone || getUserTimezone();

        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: tz
        });
    } catch (error) {
        console.error('❌ Error formatting date:', utcTimestamp, error);
        return typeof utcTimestamp === 'string' ? utcTimestamp : utcTimestamp.toISOString();
    }
};

/**
 * Format UTC timestamp (TIME ONLY)
 * Example: "08:00:00 PM"
 */
export const formatTimeInTimezone = (
    utcTimestamp: string | Date,
    timezone?: string
): string => {
    try {
        const date = parseUTCTimestamp(utcTimestamp); // ✅ Use proper UTC parser
        const tz = timezone || getUserTimezone();

        return date.toLocaleString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: tz
        });
    } catch (error) {
        console.error('❌ Error formatting time:', utcTimestamp, error);
        return typeof utcTimestamp === 'string' ? utcTimestamp : utcTimestamp.toISOString();
    }
};

/**
 * Get relative time (timezone-aware)
 * Example: "2 hours ago", "Just now"
 */
export const getRelativeTime = (utcTimestamp: string | Date): string => {
    try {
        const date = parseUTCTimestamp(utcTimestamp); // ✅ Use proper UTC parser
        const now = new Date();
        const diff = now.getTime() - date.getTime();

        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (days < 30) {
            const weeks = Math.floor(days / 7);
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
        }
        if (days < 365) {
            const months = Math.floor(days / 30);
            return `${months} month${months > 1 ? 's' : ''} ago`;
        }
        const years = Math.floor(days / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
    } catch (error) {
        console.error('❌ Error calculating relative time:', utcTimestamp, error);
        return 'Unknown';
    }
};

/**
 * Convert local time to UTC for API requests
 * Use this when sending timestamps TO the backend
 */
export const convertToUTC = (localTimestamp: string, timezone?: string): string => {
    try {
        const tz = timezone || getUserTimezone();
        const date = new Date(localTimestamp);
        return date.toISOString();
    } catch (error) {
        console.error('❌ Error converting to UTC:', localTimestamp, error);
        return localTimestamp;
    }
};

/**
 * Get current time in user's timezone (for display)
 */
export const getCurrentTimeInTimezone = (timezone?: string): string => {
    const tz = timezone || getUserTimezone();
    const now = new Date();

    return now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: tz,
        timeZoneName: 'short'
    });
};

/**
 * Get timezone info object
 */
export const getTimezoneInfo = (timezone?: string) => {
    const tz = timezone || getUserTimezone();
    return timezoneOptions.find(opt => opt.value === tz) || timezoneOptions[2]; // Default to Philippines
};

/**
 * Format for incident list (with relative time option)
 * Example: "2 hours ago (Oct 21, 08:00 PM PHT)"
 */
export const formatIncidentTime = (
    utcTimestamp: string | Date,
    showRelative: boolean = true,
    timezone?: string
): string => {
    if (showRelative) {
        const relative = getRelativeTime(utcTimestamp);
        const formatted = formatInTimezoneShort(utcTimestamp, timezone);
        return `${relative} (${formatted})`;
    }
    return formatInTimezone(utcTimestamp, timezone);
};

/**
 * Format for audit logs (full detail with timezone indicator)
 */
export const formatAuditTime = (
    utcTimestamp: string | Date,
    timezone?: string
): string => {
    return formatInTimezone(utcTimestamp, timezone);
};

/**
 * Debug function to test timezone conversion
 */
export const debugTimezone = (utcTimestamp: string) => {
    console.group('🌐 Timezone Debug');
    console.log('📥 Input (UTC):', utcTimestamp);

    const parsed = parseUTCTimestamp(utcTimestamp);
    console.log('📅 Parsed Date:', parsed.toISOString());

    timezoneOptions.forEach(tz => {
        console.log(`${tz.flag} ${tz.label}:`, formatInTimezone(utcTimestamp, tz.value));
    });

    console.groupEnd();
};