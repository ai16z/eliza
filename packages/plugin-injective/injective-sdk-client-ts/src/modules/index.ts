import * as ethUtil from "ethereumjs-util";
import { InjectiveGrpcBase } from "../grpc/grpc-base";
import { Network } from "@injectivelabs/networks";

import * as AuctionModule from "./auction";
import * as AuthModule from "./auth";
import * as AuthZModule from "./authz";
import * as BankModule from "./bank";
import * as DistributionModule from "./distribution";
import * as ExchangeModule from "./exchange";
import * as GovernanceModule from "./gov";
import * as IbcModule from "./Ibc";
import * as InsuranceFundModule from "./insurance-fund";
import * as MintModule from "./mint";
import * as MitoModule from "./mito";
import * as ExplorerModule from "./explorer";
import * as OracleModule from "./oracle";
import * as PeggyModule from "./peggy";
import * as PermissionsModule from "./permissions";
import * as StakingModule from "./staking";
import * as TokenFactoryModule from "./token-factory";
import * as WasmModule from "./wasm";
import * as WasmXModule from "./wasmx";

/**
 * Generates an Ethereum address from a private key
 * @param privateKey - Private key as a hex string (with or without '0x' prefix)
 * @returns Checksum Ethereum address
 */

export function getAddressFromPrivateKey(privateKey?: string): string {
    // Check if privateKey is undefined or empty
    if (!privateKey) {
        throw new Error("Private key is required");
    }

    // Ensure the private key has the '0x' prefix
    const formattedPrivateKey = privateKey.startsWith("0x")
        ? privateKey
        : `0x${privateKey}`;

    try {
        // Remove '0x' prefix and convert to buffer
        const privateKeyBuffer = Buffer.from(
            formattedPrivateKey.slice(2),
            "hex"
        );
        // Validate private key length
        if (privateKeyBuffer.length !== 32) {
            throw new Error("Invalid private key length. Must be 32 bytes.");
        }
        // Derive public key
        const publicKey = ethUtil.privateToPublic(privateKeyBuffer);
        // Generate address from public key
        const address = ethUtil.publicToAddress(publicKey);
        // Convert to checksum address
        return ethUtil.toChecksumAddress(address.toString("hex"));
    } catch (error) {
        console.error("Error generating address:", error);
        throw error;
    }
}
export class GrpcClient extends InjectiveGrpcBase {
    constructor(
        networkType: keyof typeof Network = "Mainnet",
        privateKey?: string
    ) {
        const ethAddress = getAddressFromPrivateKey(privateKey);
        super(networkType, ethAddress);
    }
    // Auction endpoints
    public getAuctionModuleParams =
        AuctionModule.getAuctionModuleParams.bind(this);
    public getAuctionModuleState =
        AuctionModule.getAuctionModuleState.bind(this);
    public getCurrentBasket = AuctionModule.getCurrentBasket.bind(this);
    public getAuctionRound = AuctionModule.getAuctionRound.bind(this);
    public getAuctions = AuctionModule.getAuctions.bind(this);

    //Auth endpoints
    public getAuthModuleParams = AuthModule.getAuthModuleParams.bind(this);
    public getAccountDetails = AuthModule.getAccountDetails.bind(this);
    public getAccounts = AuthModule.getAccounts.bind(this);

    //Authz endpoints
    public getGrants = AuthZModule.getGrants.bind(this);
    public getGranterGrants = AuthZModule.getGranterGrants.bind(this);
    public getGranteeGrants = AuthZModule.getGranteeGrants.bind(this);

    //Bank endpoints
    public getBankModuleParams = BankModule.getBankModuleParams.bind(this);
    public getBankBalance = BankModule.getBankBalance.bind(this);
    public getTotalSupply = BankModule.getTotalSupply.bind(this);
    public getAllTotalSupply = BankModule.getAllTotalSupply.bind(this);
    public getSupplyOf = BankModule.getSupplyOf.bind(this);
    public getDenomsMetadata = BankModule.getDenomsMetadata.bind(this);
    public getDenomMetadata = BankModule.getDenomMetadata.bind(this);
    public getDenomOwners = BankModule.getDenomOwners.bind(this);

    //Distribution endpoints
    public getDistributionModuleParams =
        DistributionModule.getDistributionModuleParams.bind(this);
    public getDelegatorRewardsForValidator =
        DistributionModule.getDelegatorRewardsForValidator.bind(this);
    public getDelegatorRewardsForValidatorNoThrow =
        DistributionModule.getDelegatorRewardsForValidatorNoThrow.bind(this);
    public getDelegatorRewards =
        DistributionModule.getDelegatorRewards.bind(this);
    public getDelegatorRewardsNoThrow =
        DistributionModule.getDelegatorRewardsNoThrow.bind(this);

    //Exchange endpoints
    //============================CHAIN===============================
    public getModuleParams = ExchangeModule.getModuleParams.bind(this);
    public getModuleState = ExchangeModule.getModuleState.bind(this);
    public getFeeDiscountSchedule =
        ExchangeModule.getFeeDiscountSchedule.bind(this);
    public getFeeDiscountAccountInfo =
        ExchangeModule.getFeeDiscountAccountInfo.bind(this);
    public getTradingRewardsCampaign =
        ExchangeModule.getTradingRewardsCampaign.bind(this);
    public getTradeRewardPoints =
        ExchangeModule.getTradeRewardPoints.bind(this);
    public getPendingTradeRewardPoints =
        ExchangeModule.getPendingTradeRewardPoints.bind(this);
    public getExchangePositions =
        ExchangeModule.getExchangePositions.bind(this);
    public getSubaccountTradeNonce =
        ExchangeModule.getSubaccountTradeNonce.bind(this);
    public getIsOptedOutOfRewards =
        ExchangeModule.getIsOptedOutOfRewards.bind(this);
    //===========================INDEXER==============================
    public getDerivativeMarkets =
        ExchangeModule.getDerivativeMarkets.bind(this);
    public getDerivativeMarket = ExchangeModule.getDerivativeMarket.bind(this);
    public getBinaryOptionsMarkets =
        ExchangeModule.getBinaryOptionsMarkets.bind(this);
    public getBinaryOptionsMarket =
        ExchangeModule.getBinaryOptionsMarket.bind(this);
    public getDerivativeOrders = ExchangeModule.getDerivativeOrders.bind(this);
    public getDerivativeOrderHistory =
        ExchangeModule.getDerivativeOrderHistory.bind(this);
    public getPositions = ExchangeModule.getPositions.bind(this);
    public getPositionsV2 = ExchangeModule.getPositionsV2.bind(this);
    public getDerivativeTrades = ExchangeModule.getDerivativeTrades.bind(this);
    public getFundingPayments = ExchangeModule.getFundingPayments.bind(this);
    public getFundingRates = ExchangeModule.getFundingRates.bind(this);
    public getDerivativeSubaccountOrdersList =
        ExchangeModule.getDerivativeSubaccountOrdersList.bind(this);
    public getDerivativeSubaccountTradesList =
        ExchangeModule.getDerivativeSubaccountTradesList.bind(this);
    public getDerivativeOrderbooksV2 =
        ExchangeModule.getDerivativeOrderbooksV2.bind(this);
    public getDerivativeOrderbookV2 =
        ExchangeModule.getDerivativeOrderbookV2.bind(this);
    public getRewards = ExchangeModule.getRewards.bind(this);
    public getSubaccountsList = ExchangeModule.getSubaccountsList.bind(this);
    public getSubaccountBalancesList =
        ExchangeModule.getSubaccountBalancesList.bind(this);
    public getSubaccountHistory =
        ExchangeModule.getSubaccountHistory.bind(this);
    public getSubaccountOrderSummary =
        ExchangeModule.getSubaccountOrderSummary.bind(this);
    public getOrderStates = ExchangeModule.getOrderStates.bind(this);
    public getAccountPortfolio = ExchangeModule.getAccountPortfolio.bind(this);
    public getAccountPortfolioBalances =
        ExchangeModule.getAccountPortfolioBalances.bind(this);
    public getSpotMarkets = ExchangeModule.getSpotMarkets.bind(this);
    public getSpotMarket = ExchangeModule.getSpotMarket.bind(this);
    public getSpotOrders = ExchangeModule.getSpotOrders.bind(this);
    public getSpotOrderHistory = ExchangeModule.getSpotOrderHistory.bind(this);
    public getSpotTrades = ExchangeModule.getSpotTrades.bind(this);
    public getSpotSubaccountOrdersList =
        ExchangeModule.getSpotSubaccountOrdersList.bind(this);
    public getSpotSubaccountTradesList =
        ExchangeModule.getSpotSubaccountTradesList.bind(this);
    public getSpotOrderbooksV2 = ExchangeModule.getSpotOrderbooksV2.bind(this);
    public getSpotOrderbookV2 = ExchangeModule.getSpotOrderbookV2.bind(this);
    public getAtomicSwapHistory =
        ExchangeModule.getAtomicSwapHistory.bind(this);
    public getGridStrategies = ExchangeModule.getGridStrategies.bind(this);
    public getHistoricalBalance =
        ExchangeModule.getHistoricalBalance.bind(this);
    public getHistoricalRpnl = ExchangeModule.getHistoricalRpnl.bind(this);
    public getHistoricalVolumes =
        ExchangeModule.getHistoricalVolumes.bind(this);
    public getPnlLeaderboard = ExchangeModule.getPnlLeaderboard.bind(this);
    public getVolLeaderboard = ExchangeModule.getVolLeaderboard.bind(this);
    public getPnlLeaderboardFixedResolution =
        ExchangeModule.getPnlLeaderboardFixedResolution.bind(this);
    public getVolLeaderboardFixedResolution =
        ExchangeModule.getVolLeaderboardFixedResolution.bind(this);
    public getDenomHolders = ExchangeModule.getDenomHolders.bind(this);
    //Governance functions
    public getGovernanceModuleParams =
        GovernanceModule.getGovernanceModuleParams.bind(this);
    public getProposals = GovernanceModule.getProposals.bind(this);
    public getProposal = GovernanceModule.getProposal.bind(this);
    public getProposalDeposits =
        GovernanceModule.getProposalDeposits.bind(this);
    public getProposalVotes = GovernanceModule.getProposalVotes.bind(this);
    public getProposalTally = GovernanceModule.getProposalTally.bind(this);
    //ibc functions
    public getDenomTrace = IbcModule.getDenomTrace.bind(this);
    public getDenomsTrace = IbcModule.getDenomsTrace.bind(this);
    //Insurance functions
    public getInsuranceModuleParams =
        InsuranceFundModule.getInsuranceModuleParams.bind(this);
    public getInsuranceFunds = InsuranceFundModule.getInsuranceFunds.bind(this);
    public getInsuranceFund = InsuranceFundModule.getInsuranceFund.bind(this);
    public getInsuranceFundDeposits =
        InsuranceFundModule.getEstimatedRedemptions.bind(this);
    public getInsuranceFundRedemptions =
        InsuranceFundModule.getPendingRedemptions.bind(this);
    //Mint functions
    public getMintModuleParams = MintModule.getMintModuleParams.bind(this);
    public getInflation = MintModule.getInflation.bind(this);
    public getAnnualProvisions = MintModule.getAnnualProvisions.bind(this);
    //Mito functions
    public getVault = MitoModule.getVault.bind(this);
    public getVaults = MitoModule.getVaults.bind(this);
    public getLpTokenPriceChart = MitoModule.getLpTokenPriceChart.bind(this);
    public getTVLChart = MitoModule.getTVLChart.bind(this);
    public getVaultsByHolderAddress =
        MitoModule.getVaultsByHolderAddress.bind(this);
    public getLPHolders = MitoModule.getLPHolders.bind(this);
    public getHolderPortfolio = MitoModule.getHolderPortfolio.bind(this);
    public getLeaderboard = MitoModule.getLeaderboard.bind(this);
    public getTransferHistory = MitoModule.getTransferHistory.bind(this);
    public getLeaderboardEpochs = MitoModule.getLeaderboardEpochs.bind(this);
    public getStakingPools = MitoModule.getStakingPools.bind(this);
    public getStakingHistory = MitoModule.getStakingHistory.bind(this);
    public getStakingRewardsByAccount =
        MitoModule.getStakingRewardsByAccount.bind(this);
    public getMissions = MitoModule.getMissions.bind(this);
    public getMissionLeaderboard = MitoModule.getMissionLeaderboard.bind(this);
    public getIDO = MitoModule.getIDO.bind(this);
    public getIDOs = MitoModule.getIDOs.bind(this);
    public getIDOSubscribers = MitoModule.getIDOSubscribers.bind(this);
    public getIDOSubscription = MitoModule.getIDOSubscription.bind(this);
    public getIDOActivities = MitoModule.getIDOActivities.bind(this);
    public getIDOWhitelist = MitoModule.getIDOWhitelist.bind(this);
    public getClaimReferences = MitoModule.getClaimReferences.bind(this);
    //Oracle functions
    public getOracleModuleParams =
        OracleModule.getOracleModuleParams.bind(this);
    //Peggy functions
    public getPeggyModuleParams = PeggyModule.getPeggyModuleParams.bind(this);
    //Permissions functions
    public getAddressesByRole = PermissionsModule.getAddressesByRole.bind(this);
    public getAddressRoles = PermissionsModule.getAddressRoles.bind(this);
    public getAllNamespaces = PermissionsModule.getAllNamespaces.bind(this);
    public getPermissionsModuleParams =
        PermissionsModule.getPermissionsModuleParams.bind(this);
    public getNamespaceByDenom =
        PermissionsModule.getNamespaceByDenom.bind(this);
    public getVouchersForAddress =
        PermissionsModule.getVouchersForAddress.bind(this);
    //Staking functions
    public getStakingModuleParams =
        StakingModule.getStakingModuleParams.bind(this);
    public getPool = StakingModule.getPool.bind(this);
    public getValidators = StakingModule.getValidators.bind(this);
    public getStakingValidator = StakingModule.getValidator.bind(this);
    public getValidatorDelegations =
        StakingModule.getValidatorDelegations.bind(this);
    public getValidatorDelegationsNoThrow =
        StakingModule.getValidatorDelegationsNoThrow.bind(this);
    public getValidatorUnbondingDelegations =
        StakingModule.getValidatorUnbondingDelegations.bind(this);
    public getValidatorUnbondingDelegationsNoThrow =
        StakingModule.getValidatorUnbondingDelegationsNoThrow.bind(this);
    public getDelegation = StakingModule.getDelegation.bind(this);
    public getDelegations = StakingModule.getDelegations.bind(this);
    public getDelegationsNoThrow =
        StakingModule.getDelegationsNoThrow.bind(this);
    public getDelegators = StakingModule.getDelegators.bind(this);
    public getDelegatorsNoThrow = StakingModule.getDelegatorsNoThrow.bind(this);
    public getUnbondingDelegations =
        StakingModule.getUnbondingDelegations.bind(this);
    public getUnbondingDelegationsNoThrow =
        StakingModule.getUnbondingDelegationsNoThrow.bind(this);
    public getReDelegations = StakingModule.getReDelegations.bind(this);
    public getReDelegationsNoThrow =
        StakingModule.getReDelegationsNoThrow.bind(this);
    //Token Factory functions
    public getDenomsFromCreator =
        TokenFactoryModule.getDenomsFromCreator.bind(this);
    public getDenomAuthorityMetadata =
        TokenFactoryModule.getDenomAuthorityMetadata.bind(this);
    public getTokenFactoryModuleParams =
        TokenFactoryModule.getTokenFactoryModuleParams.bind(this);
    public getTokenFactoryModuleState =
        TokenFactoryModule.getTokenFactoryModuleState.bind(this);
    //Wasm contract functions
    public getContractAccountsBalance =
        WasmModule.getContractAccountsBalance.bind(this);
    public getContractState = WasmModule.getContractState.bind(this);
    public getContractInfo = WasmModule.getContractInfo.bind(this);
    public getContractHistory = WasmModule.getContractHistory.bind(this);
    public getSmartContractState = WasmModule.getSmartContractState.bind(this);
    public getRawContractState = WasmModule.getRawContractState.bind(this);
    public getContractCodes = WasmModule.getContractCodes.bind(this);
    public getContractCode = WasmModule.getContractCode.bind(this);
    public getContractCodeContracts =
        WasmModule.getContractCodeContracts.bind(this);
    //Wasmx functions
    public getWasmxModuleParams = WasmXModule.getWasmxModuleParams.bind(this);
    public getWasmxWasmModuleState = WasmXModule.getWasmxModuleState.bind(this);
    //Explorer functions
    //===========================INDEXER==============================
    public getTxByHash = ExplorerModule.getTxByHash.bind(this);
    public getAccountTx = ExplorerModule.getAccountTx.bind(this);
    public getExplorerValidator = ExplorerModule.getValidator.bind(this);
    public getValidatorUptime = ExplorerModule.getValidatorUptime.bind(this);
    public getPeggyDepositTxs = ExplorerModule.getPeggyDepositTxs.bind(this);
    public getPeggyWithdrawalTxs =
        ExplorerModule.getPeggyWithdrawalTxs.bind(this);
    public getBlocks = ExplorerModule.getBlocks.bind(this);
    public getBlock = ExplorerModule.getBlock.bind(this);
    public getTxs = ExplorerModule.getTxs.bind(this);
    public getIBCTransferTxs = ExplorerModule.getIBCTransferTxs.bind(this);
    public getExplorerStats = ExplorerModule.getExplorerStats.bind(this);
}
