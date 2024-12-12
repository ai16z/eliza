export const MESSAGE_CONSTANTS = {
    MAX_MESSAGES: 50,
    RECENT_MESSAGE_COUNT: 5,
    CHAT_HISTORY_COUNT: 10,
    DEFAULT_SIMILARITY_THRESHOLD: 0.6,
    DEFAULT_SIMILARITY_THRESHOLD_FOLLOW_UPS: 0.4,
    INTEREST_DECAY_TIME: 5 * 60 * 1000, // 5 minutes
    PARTIAL_INTEREST_DECAY: 3 * 60 * 1000, // 3 minutes
} as const;

export const TIMING_CONSTANTS = {
    TEAM_MEMBER_DELAY: 1500, // 1.5 seconds
    TEAM_MEMBER_DELAY_MIN: 1000, // 1 second
    TEAM_MEMBER_DELAY_MAX: 3000, // 3 seconds
    LEADER_DELAY_MIN: 2000, // 2 seconds
    LEADER_DELAY_MAX: 4000  // 4 seconds
} as const;

export const RESPONSE_CHANCES = {
    AFTER_LEADER: 0.5,  // 50% chance to respond after leader
} as const;

export const TEAM_COORDINATION = {
    KEYWORDS: [
        'team',
        'everyone',
        'all agents',
        'team update',
        'gm team',
        'hello team',
        'hey team',
        'hi team',
        'morning team',
        'evening team',
        'night team',
        'update team',
    ]
} as const;