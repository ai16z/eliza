export * from "./getbalance";
import { getTokenMarketDataAction } from './getTokenMarketData';

export const actions = {
    getTokenMarketData: getTokenMarketDataAction,
};