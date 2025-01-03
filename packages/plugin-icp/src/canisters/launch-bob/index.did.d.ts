import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Balance {
  'maybe_ledger' : [] | [Principal],
  'ticker' : string,
  'token_id' : bigint,
  'balance_e8s' : bigint,
}
export interface Candle {
  'low' : number,
  'high' : number,
  'close' : number,
  'open' : number,
  'time' : bigint,
}
export interface CreateTokenArg {
  'maybe_website' : [] | [string],
  'ticker' : string,
  'name' : string,
  'description' : string,
  'image' : string,
  'maybe_twitter' : [] | [string],
  'maybe_telegram' : [] | [string],
}
export interface LiquidityPool {
  'token_id' : bigint,
  'reserve_token' : bigint,
  'reserve_icp' : bigint,
  'total_supply' : bigint,
}
export type LiquidityTask = { 'DepositICP' : null } |
  { 'MintPosition' : null } |
  { 'DepositToken' : null } |
  {
    'CreatePosition' : {
      'tickUpper' : number,
      'amount0Desired' : string,
      'amount1Desired' : string,
      'tickLower' : number,
    }
  };
export interface Metadata { 'icp_fees_e8s' : bigint, 'next_token_id' : bigint }
export interface Order {
  'ts' : bigint,
  'from' : Principal,
  'amount_e8s' : bigint,
  'order_type' : OrderType,
}
export type OrderBy = { 'ReserveIcp' : null } |
  { 'CreatedAtSkipBatches' : { 'batch_count' : bigint } } |
  { 'Successful' : null } |
  { 'CreatedAt' : null } |
  { 'CreatedBy' : { 'creator' : Principal } };
export type OrderType = { 'Buy' : null } |
  { 'Sell' : null };
export interface PendingTransfer {
  'to' : Principal,
  'amount_e8s' : bigint,
  'ledger' : Principal,
  'timestamp' : bigint,
}
export type Result = { 'Ok' : bigint } |
  { 'Err' : string };
export interface TokenData {
  'orders' : Array<Order>,
  'candles' : Array<Candle>,
  'liquidity_pool' : LiquidityPool,
  'token_info' : TokenInfo,
}
export interface TokenInfo {
  'maybe_website' : [] | [string],
  'tasks' : Array<LiquidityTask>,
  'maybe_ledger' : [] | [Principal],
  'ticker' : string,
  'maybe_icpswap_pool' : [] | [Principal],
  'name' : string,
  'description' : string,
  'created_at' : bigint,
  'created_by' : Principal,
  'tasks_v2' : [] | [Array<LiquidityTask>],
  'image' : string,
  'maybe_twitter' : [] | [string],
  'maybe_telegram' : [] | [string],
}
export interface _SERVICE {
  'buy_from' : ActorMethod<[bigint, bigint], Result>,
  'create_token' : ActorMethod<[CreateTokenArg], bigint>,
  'create_token_and_buy' : ActorMethod<[CreateTokenArg, bigint], Result>,
  'get_last_order' : ActorMethod<[], [] | [[Order, bigint, string]]>,
  'get_metadata' : ActorMethod<[], Metadata>,
  'get_pending_transfers' : ActorMethod<[], Array<PendingTransfer>>,
  'get_robert_choice' : ActorMethod<[], [TokenInfo, LiquidityPool]>,
  'get_token_balance' : ActorMethod<[bigint, Principal], bigint>,
  'get_token_balances' : ActorMethod<[Principal], Array<Balance>>,
  'get_token_data' : ActorMethod<[bigint], TokenData>,
  'get_token_info' : ActorMethod<[bigint], [] | [TokenInfo]>,
  'get_tokens' : ActorMethod<
    [OrderBy, bigint],
    Array<[TokenInfo, LiquidityPool]>
  >,
  'get_tokens_created_by' : ActorMethod<
    [Principal],
    Array<[TokenInfo, LiquidityPool]>
  >,
  'get_top_holders' : ActorMethod<[bigint, bigint], Array<[Principal, bigint]>>,
  'sell_from' : ActorMethod<[bigint, bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];