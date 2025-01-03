export const idlFactory = ({ IDL }) => {
    const Result = IDL.Variant({ 'Ok' : IDL.Nat64, 'Err' : IDL.Text });
    const CreateTokenArg = IDL.Record({
      'maybe_website' : IDL.Opt(IDL.Text),
      'ticker' : IDL.Text,
      'name' : IDL.Text,
      'description' : IDL.Text,
      'image' : IDL.Text,
      'maybe_twitter' : IDL.Opt(IDL.Text),
      'maybe_telegram' : IDL.Opt(IDL.Text),
    });
    const OrderType = IDL.Variant({ 'Buy' : IDL.Null, 'Sell' : IDL.Null });
    const Order = IDL.Record({
      'ts' : IDL.Nat64,
      'from' : IDL.Principal,
      'amount_e8s' : IDL.Nat64,
      'order_type' : OrderType,
    });
    const Metadata = IDL.Record({
      'icp_fees_e8s' : IDL.Nat64,
      'next_token_id' : IDL.Nat64,
    });
    const PendingTransfer = IDL.Record({
      'to' : IDL.Principal,
      'amount_e8s' : IDL.Nat64,
      'ledger' : IDL.Principal,
      'timestamp' : IDL.Nat64,
    });
    const LiquidityTask = IDL.Variant({
      'DepositICP' : IDL.Null,
      'MintPosition' : IDL.Null,
      'DepositToken' : IDL.Null,
      'CreatePosition' : IDL.Record({
        'tickUpper' : IDL.Int32,
        'amount0Desired' : IDL.Text,
        'amount1Desired' : IDL.Text,
        'tickLower' : IDL.Int32,
      }),
    });
    const TokenInfo = IDL.Record({
      'maybe_website' : IDL.Opt(IDL.Text),
      'tasks' : IDL.Vec(LiquidityTask),
      'maybe_ledger' : IDL.Opt(IDL.Principal),
      'ticker' : IDL.Text,
      'maybe_icpswap_pool' : IDL.Opt(IDL.Principal),
      'name' : IDL.Text,
      'description' : IDL.Text,
      'created_at' : IDL.Nat64,
      'created_by' : IDL.Principal,
      'tasks_v2' : IDL.Opt(IDL.Vec(LiquidityTask)),
      'image' : IDL.Text,
      'maybe_twitter' : IDL.Opt(IDL.Text),
      'maybe_telegram' : IDL.Opt(IDL.Text),
    });
    const LiquidityPool = IDL.Record({
      'token_id' : IDL.Nat64,
      'reserve_token' : IDL.Nat64,
      'reserve_icp' : IDL.Nat64,
      'total_supply' : IDL.Nat64,
    });
    const Balance = IDL.Record({
      'maybe_ledger' : IDL.Opt(IDL.Principal),
      'ticker' : IDL.Text,
      'token_id' : IDL.Nat64,
      'balance_e8s' : IDL.Nat64,
    });
    const Candle = IDL.Record({
      'low' : IDL.Float64,
      'high' : IDL.Float64,
      'close' : IDL.Float64,
      'open' : IDL.Float64,
      'time' : IDL.Nat64,
    });
    const TokenData = IDL.Record({
      'orders' : IDL.Vec(Order),
      'candles' : IDL.Vec(Candle),
      'liquidity_pool' : LiquidityPool,
      'token_info' : TokenInfo,
    });
    const OrderBy = IDL.Variant({
      'ReserveIcp' : IDL.Null,
      'CreatedAtSkipBatches' : IDL.Record({ 'batch_count' : IDL.Nat64 }),
      'Successful' : IDL.Null,
      'CreatedAt' : IDL.Null,
      'CreatedBy' : IDL.Record({ 'creator' : IDL.Principal }),
    });
    return IDL.Service({
      'buy_from' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result], []),
      'create_token' : IDL.Func([CreateTokenArg], [IDL.Nat64], []),
      'create_token_and_buy' : IDL.Func(
          [CreateTokenArg, IDL.Nat64],
          [Result],
          [],
        ),
      'get_last_order' : IDL.Func(
          [],
          [IDL.Opt(IDL.Tuple(Order, IDL.Nat64, IDL.Text))],
          ['query'],
        ),
      'get_metadata' : IDL.Func([], [Metadata], ['query']),
      'get_pending_transfers' : IDL.Func(
          [],
          [IDL.Vec(PendingTransfer)],
          ['query'],
        ),
      'get_robert_choice' : IDL.Func([], [TokenInfo, LiquidityPool], ['query']),
      'get_token_balance' : IDL.Func(
          [IDL.Nat64, IDL.Principal],
          [IDL.Nat64],
          ['query'],
        ),
      'get_token_balances' : IDL.Func(
          [IDL.Principal],
          [IDL.Vec(Balance)],
          ['query'],
        ),
      'get_token_data' : IDL.Func([IDL.Nat64], [TokenData], ['query']),
      'get_token_info' : IDL.Func([IDL.Nat64], [IDL.Opt(TokenInfo)], ['query']),
      'get_tokens' : IDL.Func(
          [OrderBy, IDL.Nat64],
          [IDL.Vec(IDL.Tuple(TokenInfo, LiquidityPool))],
          ['query'],
        ),
      'get_tokens_created_by' : IDL.Func(
          [IDL.Principal],
          [IDL.Vec(IDL.Tuple(TokenInfo, LiquidityPool))],
          ['query'],
        ),
      'get_top_holders' : IDL.Func(
          [IDL.Nat64, IDL.Nat64],
          [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Nat64))],
          ['query'],
        ),
      'sell_from' : IDL.Func([IDL.Nat64, IDL.Nat64], [Result], []),
    });
  };
  export const init = ({ IDL }) => { return []; };