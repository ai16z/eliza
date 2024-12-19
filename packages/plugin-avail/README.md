# @ai16z/plugin-avail - Plugin for Avail

This is a plugin for using Eliza to interact with the Avail DA network. Defaults to Turing testnet, but can be customized to use Mainnet by changing the RPC in the `.env` file at `AVAIL_RPC_URL`.

## Actions
- **transfer**: This action enables the transfer of AVAIL tokens from the agent's wallet (as defined by the keyring generated from `AVAIL_SEED`) to another wallet. To use just mention the transfer of AVAIL tokens to an Avail account.

    - name: `SEND_AVAIL`

    - Message sample: `Send 100 AVAIL to 5GWbvXjefEvXXETtKQH7YBsUaPc379KAQATW1eqeJT26cbsK`

- **submitData**: This action enables the submission of any arbitrary data to the Avail DA network. To use just mention that you need to send "any data" to Avail. You can customize the Avail `appID` through which the agent submits the data by modifying the `AVAIL_APP_ID` env config.

    - name: `SUBMIT_DATA`

    - Message sample: `Submit the following data to Avail "Hello World!"`

## Resources
- [Avail Documentation](https://docs.availproject.org/)
- [Set up an Avail Account](https://docs.availproject.org/user-guides/accounts#seed-phrases) - Learn how to get your `AVAIL_SEED`
- [Find more Network Information like RPC endpoints](https://docs.availproject.org/docs/networks)
- [Learn more about appIDs](https://docs.availproject.org/docs/build-with-avail/interact-with-avail-da/app-id)
- [Learn more about Avail](https://www.availproject.org/)
- [Awesome Avail Repo](https://github.com/availproject/awesome-avail)

