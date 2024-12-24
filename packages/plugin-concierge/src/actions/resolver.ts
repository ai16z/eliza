import { elizaLogger } from "@elizaos/core";
import { isAddress } from "viem";

export const converseEndpointURL = "https://converse.xyz/profile/";

export type InfoCache = Map<string, UserInfo>;
export type ConverseProfile = {
    address: string | undefined;
    onXmtp: boolean;
    avatar: string | undefined;
    formattedName: string | undefined;
    name: string | undefined;
};
export type UserInfo = {
    ensDomain?: string | undefined;
    address?: string | undefined;
    preferredName: string | undefined;
    converseUsername?: string | undefined;
    ensInfo?: EnsData | undefined;
    avatar?: string | undefined;
    converseEndpoint?: string | undefined;
};

export interface EnsData {
    address?: string;
    avatar?: string;
    avatar_small?: string;
    converse?: string;
    avatar_url?: string;
    contentHash?: string;
    description?: string;
    ens?: string;
    ens_primary?: string;
    github?: string;
    resolverAddress?: string;
    twitter?: string;
    url?: string;
    wallets?: {
        eth?: string;
    };
}

class UserInfoCache {
    private static instance: UserInfoCache;
    private cache: InfoCache = new Map();

    private constructor() {}

    public static getInstance(): UserInfoCache {
        if (!UserInfoCache.instance) {
            UserInfoCache.instance = new UserInfoCache();
        }
        return UserInfoCache.instance;
    }

    get(key: string): UserInfo | undefined {
        return this.cache.get(key.toLowerCase());
    }

    set(key: string, data: UserInfo): void {
        this.cache.set(key.toLowerCase(), data);
    }

    clear(key?: string): void {
        if (key) {
            this.cache.delete(key.toLowerCase());
        } else {
            this.cache.clear();
        }
    }
}

// Use the singleton instance
export const userInfoCache = UserInfoCache.getInstance();

export const getUserInfo = async (
    key: string,
    clientAddress?: string
): Promise<UserInfo | undefined> => {
    const data: UserInfo = {
        ensDomain: undefined,
        address: undefined,
        converseUsername: undefined,
        ensInfo: undefined,
        avatar: undefined,
        converseEndpoint: undefined,
        preferredName: undefined,
    };

    if (typeof key !== "string") {
        elizaLogger.error("userinfo key must be a string");
        return data;
    }

    const cachedData = userInfoCache.get(key);
    if (cachedData) return cachedData;

    key = key?.toLowerCase();
    clientAddress = clientAddress?.toLowerCase();

    // Determine user information based on provided key
    if (isAddress(clientAddress || "")) {
        data.address = clientAddress;
    } else if (isAddress(key || "")) {
        data.address = key;
    } else if (key.includes(".eth")) {
        data.ensDomain = key;
    } else if (["@user", "@me", "@bot"].includes(key)) {
        data.address = clientAddress;
        data.ensDomain = key.replace("@", "") + ".eth";
        data.converseUsername = key.replace("@", "");
    } else if (key === "@alix") {
        data.address =
            "0x3a044b218BaE80E5b9E16609443A192129A67BeA".toLowerCase();
        data.converseUsername = "alix";
    } else if (key === "@bo") {
        data.address =
            "0xbc3246461ab5e1682baE48fa95172CDf0689201a".toLowerCase();
        data.converseUsername = "bo";
    } else {
        data.converseUsername = key;
    }

    data.preferredName = data.ensDomain || data.converseUsername || "Friend";
    const keyToUse =
        data.address?.toLowerCase() || data.ensDomain || data.converseUsername;

    if (!keyToUse) {
        elizaLogger.info(
            "Unable to determine a valid key for fetching user info."
        );
        return data;
    } else {
        // Fetch ENS data
        try {
            const response = await fetch(`https://ensdata.net/${keyToUse}`);
            if (response.status !== 200) {
                if (process.env.MSG_LOG === "true")
                    elizaLogger.info("- ENS data request failed for", keyToUse);
            } else {
                const ensData = (await response.json()) as EnsData;
                if (ensData) {
                    data.ensInfo = ensData;
                    data.ensDomain = ensData.ens || data.ensDomain;
                    data.address =
                        ensData.address?.toLowerCase() ||
                        data.address?.toLowerCase();
                    data.avatar = ensData.avatar_url || data.avatar;
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ENS data for ${keyToUse}`);
        }
        //Converse profile
        try {
            const username = keyToUse.replace("@", "");
            const converseEndpoint = `${converseEndpointURL}${username}`;
            const response = await fetchWithTimeout(
                converseEndpoint,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({ peer: username }),
                },
                5000
            );
            if (!response?.ok) {
                console.error(
                    `Converse profile request failed with status ${response?.status}`
                );
            }
            const converseData = (await response?.json()) as ConverseProfile;
            if (converseData) {
                data.converseUsername =
                    converseData.formattedName ||
                    converseData.name ||
                    data.converseUsername;
                data.address =
                    converseData.address?.toLowerCase() ||
                    data.address?.toLowerCase();
                data.avatar = converseData.avatar || data.avatar;
                data.converseEndpoint = converseEndpoint;
            }
        } catch (error) {
            console.error("Failed to fetch Converse profile:", error);
        }

        data.preferredName =
            data.ensDomain || data.converseUsername || "Friend";
        userInfoCache.set(keyToUse, data);
        return data;
    }
};

const fetchWithTimeout = async (
    url: string,
    options: RequestInit,
    timeout = 5000
) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        console.error("fetching");
    }
};
