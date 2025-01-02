export interface TwitterUser {
    // Basics of the user
    id: string;
    name: string;
    screen_name: string; //Screen name
    description: string;
    location?: string;

    // Profile Url
    url?: string // eg. https://x.com/KaitoEasyAPI
    twitterUrl?: string; //eg.https://twitter.com/KaitoEasyAPI

    // Statistics
    followers: number;
    following: number;
    statusesCount: number;
    favouritesCount: number;
    mediaCount: number;

    // Verification Status
    isBlueVerified: boolean; // Is a blue verified account

    // Profile Picture
    profilePicture: string; // eg .https://pbs.twimg.com/profile_images/1846385503987552257/5_6H39MO_normal.jpg
    coverPicture?: string; // eg. https://pbs.twimg.com/profile_banners/1825192371518377984/1729047585

    createdAt: string; // eg.Sun Aug 18 15:25:59 +0000 2024

    canDm: boolean;
    canMediaTag: boolean;
    isTranslator: boolean;
    possiblySensitive: boolean;

    //
    pinnedTweetIds?: string[];
    withheldInCountries?: string[];

    // Profile bio
    profile_bio?: {
        description: string;
        entities?: {
            description: any;
            url?: {
                urls?: Array<{
                    display_url: string;
                    expanded_url: string;
                    url: string;
                    indices: number[];
                }>;
            };
        };
    };
}

export interface TwitterTweet {
    id: string;
    text: string;
    type: 'tweet';
    source: string;
    lang: string;

    // URLs
    url: string;
    twitterUrl: string;

    // Statistics
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    quoteCount: number;
    viewCount: number;
    bookmarkCount: number;

    createdAt: string; //Sun Aug 18 15:25:59 +0000 2024

    // Reply info
    isReply: boolean;
    inReplyToId?: string;
    inReplyToUserId?: string;
    inReplyToUsername?: string;


    conversationId?: string;

    // Extended entities
    extendedEntities?: Record<string, any>;
    entities?: Record<string, any>;
    place?: Record<string, any>;

    // quoted tweet
    quoted_tweet?: TwitterTweet | null;

    // reweeted tweet
    retweeted_tweet?: TwitterTweet | null;

    // card info
    card?: any | null;
}



export interface AdvancedSearchResponse {
    tweets: TwitterTweet[];
    has_next_page: boolean;
    next_cursor?: string;
}

export interface UserInfoResponse {
    data?: TwitterUser;
    status: string; // eg.success, fail
    msg: string;
}

export interface UserFollowerResponse {
    followers?: TwitterUser[];
    has_next_page: boolean;
    next_cursor?: string;
    status: string; // eg.success, fail
    msg: string;
}

export interface TweetRepliesResponse {
    tweets?: TwitterTweet[];
    has_next_page: boolean;
    next_cursor?: string;
    status: string; // eg.success, fail
    msg: string;
}

export interface AdvancedSearchParams {
    query: string; // Advanced search query.Reference: https://github.com/igorbrigadir/twitter-advanced-search
    cursor?: string;
    queryType?: 'Latest' | 'Top'; //Default is 'Latest'
}

export interface UserInfoParams {
    userName: string;
}

export interface UserFollowersParams {
    userName: string;
    cursor?: string;
    max_results?: number;
}

export interface TweetRepliesParams {
    tweetId: string;
    cursor?: string;
}

export interface UserMentionsParams {
    userName: string;
    since_time?: number; //On or after a specified unix timestamp in seconds.
    until_time?: number; //Until or before a specified unix timestamp in seconds.
    cursor?: string;
}

export interface UserMentionsResponse {
    tweets?: TwitterTweet[];
    has_next_page: boolean;
    next_cursor?: string;
    status: string; // eg.success, fail
    msg: string;
}


export interface UserTimeLineParams {
    userName: string;
    include_replys?: boolean; // Default is false.
    since_time?: number; //On or after a specified unix timestamp in seconds.
    until_time?: number; //Until or before a specified unix timestamp in seconds.
    cursor?: string;
}

export interface UserTimeLineResponse {
    tweets?: TwitterTweet[];
    has_next_page: boolean;
    next_cursor?: string;
    status: string; // eg.success, fail
    msg: string;
}

export interface ListTweetsLookUpParams {
    list_id: number;
    since_time?: number; //On or after a specified unix timestamp in seconds.
    until_time?: number; //Until or before a specified unix timestamp in seconds.
    cursor?: string;
}

export interface ListTweetsLookUpResponse {
    tweets?: TwitterTweet[];
    has_next_page: boolean;
    next_cursor?: string;
    status: string; // eg.success, fail
    msg: string;
}