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

export const MESSAGE_CONSTANTS = {
    MAX_MESSAGES: 10,
    RECENT_MESSAGE_COUNT: 3,
    CHAT_HISTORY_COUNT: 5,
    INTEREST_DECAY_TIME: 5 * 60 * 1000, // 5 minutes
    PARTIAL_INTEREST_DECAY: 3 * 60 * 1000, // 3 minutes
    DEFAULT_SIMILARITY_THRESHOLD: 0.3,
    DEFAULT_SIMILARITY_THRESHOLD_FOLLOW_UPS: 0.20,
} as const;

export const MESSAGE_LENGTH_THRESHOLDS = {
    LOSE_INTEREST: 100,
    SHORT_MESSAGE: 10,
    VERY_SHORT_MESSAGE: 2,
    IGNORE_RESPONSE: 4,
} as const;

export const TIMING_CONSTANTS = {
    LEADER_RESPONSE_TIMEOUT: 3000,
    TEAM_MEMBER_DELAY: 1500,
    LEADER_DELAY_MIN: 3000,
    LEADER_DELAY_MAX: 4000,
    TEAM_MEMBER_DELAY_MIN: 1000,
    TEAM_MEMBER_DELAY_MAX: 3000,
} as const;

export const RESPONSE_CHANCES = {
    AFTER_LEADER: 0.5, // 50% chance
    FREQUENT_CHATTER: 0.5, // Base chance for frequent responders
} as const;

export const LOSE_INTEREST_WORDS = [
    "shut up",
    "stop",
    "please shut up",
    "shut up please",
    "dont talk",
    "silence",
    "stop talking",
    "be quiet",
    "hush",
    "wtf",
    "chill",
    "stfu",
    "stupid bot",
    "dumb bot",
    "stop responding",
    "god damn it",
    "god damn",
    "goddamnit",
    "can you not",
    "can you stop",
    "be quiet",
    "hate you",
    "hate this",
    "fuck up",
] as const;

export const IGNORE_RESPONSE_WORDS = [
    "lol",
    "nm",
    "uh",
    "wtf",
    "stfu",
    "dumb",
    "jfc",
    "omg",
] as const;