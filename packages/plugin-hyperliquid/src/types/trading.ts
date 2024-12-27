/**
          _____                    _____                    _____                    _____           _______                   _____          
         /\    \                  /\    \                  /\    \                  /\    \         /::\    \                 /\    \         
        /::\    \                /::\    \                /::\    \                /::\____\       /::::\    \               /:::\____\        
       /::::\    \               \:::\    \              /::::\    \              /:::/    /      /::::::\    \             /:::/    /        
      /::::::\    \               \:::\    \            /::::::\    \            /:::/    /      /::::::::\    \           /:::/   _/___      
     /:::/\:::\    \               \:::\    \          /:::/\:::\    \          /:::/    /      /:::/~~\:::\    \         /:::/   /\    \     
    /:::/__\:::\    \               \:::\    \        /:::/__\:::\    \        /:::/    /      /:::/    \:::\    \       /:::/   /::\____\    
   /::::\   \:::\    \              /::::\    \      /::::\   \:::\    \      /:::/    /      /:::/    / \:::\    \     /:::/   /:::/    /    
  /::::::\   \:::\    \    ____    /::::::\    \    /::::::\   \:::\    \    /:::/    /      /:::/____/   \:::\____\   /:::/   /:::/   _/___  
 /:::/\:::\   \:::\    \  /\   \  /:::/\:::\    \  /:::/\:::\   \:::\    \  /:::/    /      |:::|    |     |:::|    | /:::/___/:::/   /\    \ 
/:::/  \:::\   \:::\____\/::\   \/:::/  \:::\____\/:::/  \:::\   \:::\____\/:::/____/       |:::|____|     |:::|    ||:::|   /:::/   /::\____\
\::/    \:::\  /:::/    /\:::\  /:::/    \::/    /\::/    \:::\   \::/    /\:::\    \        \:::\    \   /:::/    / |:::|__/:::/   /:::/    /
 \/____/ \:::\/:::/    /  \:::\/:::/    / \/____/  \/____/ \:::\   \/____/  \:::\    \        \:::\    \ /:::/    /   \:::\/:::/   /:::/    /  
          \::::::/    /    \::::::/    /                    \:::\    \       \:::\    \        \:::\    /:::/    /     \::::::/   /:::/    /   
           \::::/    /      \::::/____/                      \:::\____\       \:::\    \        \:::\__/:::/    /       \::::/___/:::/    /   
           /:::/    /        \:::\    \                       \::/    /        \:::\    \        \::::::::/    /         \:::\__/:::/    /    
          /:::/    /          \:::\    \                       \/____/          \:::\    \        \::::::/    /           \::::::::/    /     
         /:::/    /            \:::\    \                                        \:::\____\        \::::/    /             \::::::/    /      
        /:::/    /              \:::\    \                                        \::/    /         ~~                      \::/____/        
         \/____/                  \:::\____\                                        \/____/                                   ~~              
                                  \/____/                                                                                                     
*/

import type { Hex } from '../types/common';
import { OrderType, TimeInForce } from './constants';

export type OrderSide = 'buy' | 'sell';
export type GroupingStrategy = 'na' | 'normalTpsl' | 'positionTpsl';

export interface OrderBase {
    /** An integer representing the asset being traded. */
    a: number;

    /** Position side (true for long, false for short). */
    b: boolean;

    /** Size (in base currency units). */
    s: string;

    /** Is reduce-only? */
    r?: boolean;

    /** Client Order ID. */
    c?: Hex;
}

export interface LimitOrder extends OrderBase {
    /** Price. */
    p: string;

    /** Order type and parameters. */
    t: {
        /** Limit order parameters. */
        limit: {
            /** Time-in-force. */
            tif: TimeInForce;
        };
    };
}

export interface MarketOrder extends OrderBase {
    /** Order type and parameters. */
    t: {
        /** Market order parameters. */
        market: true;
    };
}

export interface TriggerOrder extends OrderBase {
    /** Price. */
    p: string;

    /** Order type and parameters. */
    t: {
        /** Trigger order parameters. */
        trigger: {
            /** Is the market order. */
            isMarket: boolean;

            /** Trigger price. */
            triggerPx: string;

            /** Indicates if it's take-profit or stop-loss. */
            tpsl: "tp" | "sl";
        };
    };
}

export type Order = LimitOrder | MarketOrder | TriggerOrder;

export interface OrderRequest {
    action: {
        /** Type of action. */
        type: "order";

        /** Order parameters. */
        orders: Order[];

        /** Order grouping strategy */
        grouping: GroupingStrategy;

        /** Builder fee. */
        builder?: {
            /** The address of the builder. */
            b: Hex;

            /** The builder fee to charge in tenths of basis points. */
            f: number;
        };
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface OrderResponse {
    status: "ok";
    response: {
        type: "order";
        data: {
            statuses: (
                | {
                    resting: {
                        oid: number;
                        cloid?: Hex;
                    };
                }
                | {
                    filled: {
                        totalSz: string;
                        avgPx: string;
                        oid: number;
                        cloid?: Hex;
                    };
                }
                | {
                    error: string;
                }
            )[];
        };
    };
}

export interface CancelRequest {
    action: {
        type: "cancel";
        cancels: {
            a: number;
            o: number;
        }[];
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface CancelResponse {
    status: "ok";
    response: {
        type: "cancel";
        data: {
            statuses: (string | { error: string })[];
        };
    };
}

export interface ModifyRequest {
    action: {
        type: "modify";
        oid: number;
        order: Order;
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface BatchModifyRequest {
    action: {
        type: "batchModify";
        modifies: {
            oid: number;
            order: Order;
        }[];
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface UpdateLeverageRequest {
    action: {
        type: "updateLeverage";
        asset: number;
        isCross: boolean;
        leverage: number;
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface UpdateIsolatedMarginRequest {
    action: {
        type: "updateIsolatedMargin";
        asset: number;
        isBuy: boolean;
        ntli: number;
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface TwapOrderRequest {
    action: {
        type: "twapOrder";
        twap: {
            /** An integer representing the asset being traded. */
            a: number;

            /** Position side (true for long, false for short). */
            b: boolean;

            /** Size (in base currency units). */
            s: string;

            /** Is reduce-only? */
            r: boolean;

            /** TWAP duration in minutes. */
            m: number;

            /** Enable random order timing. */
            t: boolean;
        };
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface TwapOrderResponse {
    status: "ok";
    response: {
        type: "twapOrder";
        data: {
            twapId: number;
        };
    };
}

export interface TwapCancelRequest {
    action: {
        type: "twapCancel";
        /** An integer representing the asset being traded. */
        a: number;

        /** Twap ID. */
        t: number;
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface TwapCancelResponse {
    status: "ok";
    response: {
        type: "twapCancel";
        data: {
            status: string;
        };
    };
}

export interface ScheduleCancelRequest {
    action: {
        type: "scheduleCancel";
        /** Scheduled time (in ms since epoch). Must be at least 5 seconds in the future. */
        time?: number;
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface CancelByCloidRequest {
    action: {
        type: "cancelByCloid";
        cancels: {
            /** An integer representing the asset being traded. */
            asset: number;

            /** Client Order ID. */
            cloid: Hex;
        }[];
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}

export interface MarketMakerRequest {
    action: {
        type: "marketMaker";
        orders: {
            /** An integer representing the asset being traded. */
            a: number;

            /** Position side (true for long, false for short). */
            b: boolean;

            /** Price. */
            p: string;

            /** Size (in base currency units). */
            s: string;

            /** Is reduce-only? */
            r?: boolean;

            /** Client Order ID. */
            c?: Hex;
        }[];
    };

    /** Vault address (optional, for vault trading). */
    vaultAddress?: Hex;
}
