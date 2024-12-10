import "EVM"

/// Executes the calldata from the signer's COA
///
transaction(evmContractAddressHex: String, calldata: String, gasLimit: UInt64, value: UFix64) {

    let evmAddress: EVM.EVMAddress
    let coa: auth(EVM.Call) &EVM.CadenceOwnedAccount

    prepare(signer: auth(BorrowValue) &Account) {
        self.evmAddress = EVM.addressFromString(evmContractAddressHex)

        let storagePath = StoragePath(identifier: "evm")!
        let publicPath = PublicPath(identifier: "evm")!

        // Reference signer's COA if one exists
        let coa = signer.storage.borrow<auth(EVM.Withdraw) &EVM.CadenceOwnedAccount>(from: storagePath)
        if coa == nil {
            let coa <- EVM.createCadenceOwnedAccount()
            signer.storage.save<@EVM.CadenceOwnedAccount>(<-coa, to: storagePath)
            let addressableCap = signer.capabilities.storage.issue<&EVM.CadenceOwnedAccount>(storagePath)
            signer.capabilities.unpublish(publicPath)
            signer.capabilities.publish(addressableCap, at: publicPath)
        }

        self.coa = signer.storage.borrow<auth(EVM.Call) &EVM.CadenceOwnedAccount>(from: storagePath)
            ?? panic("Could not borrow COA from provided gateway address")
    }

    execute {
        let valueBalance = EVM.Balance(attoflow: 0)
        valueBalance.setFLOW(flow: value)
        let callResult = self.coa.call(
            to: self.evmAddress,
            data: calldata.decodeHex(),
            gasLimit: gasLimit,
            value: valueBalance
        )
        assert(callResult.status == EVM.Status.successful, message: "Call failed")
    }
}
