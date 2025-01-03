# Bagel fine tuning

## Setup

Go to [bakery.bagel.net](https://bakery.bagel.net) and create an account. Then get an API key.

Set the `BAGEL_API_KEY` environment variable to your API key.

In bakery, create your model and fine-tune dataset.

## Fine-tune with Eliza

```bash
curl -X POST http://localhost:3000/fine-tune \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jvBpxrTNqGqhnfQhSEqCdsG6aTSP8IBL" \
  -d '{
    "dataset_type": "MODEL",
    "title": "smollm2-fine-tuning-00000099",
    "category": "AI",
    "details": "Test",
    "tags": [],
    "user_id": "96c633e6-e973-446e-b782-6235324c0a56",
    "fine_tune_payload": {
      "asset_id": "d0a3f665-c207-4ee6-9daa-0cbdb272eeca",
      "model_name": "llama3-fine-tuning-00000001",
      "base_model": "0488b40b-829f-4c3a-9880-d55d76775dd1",
      "file_name": "qa_data.csv",
      "epochs": 1,
      "learning_rate": 0.01,
      "user_id": "96c633e6-e973-446e-b782-6235324c0a56",
      "use_ipfs": "false",
      "input_column": "question",
      "output_column": "answer"
    }
  }'
```

This can take a while to complete. You can check the status of the fine-tune job in the bakery dashboard. When it is complete, you can download the fine-tuned model here:

```bash
curl -X GET "http://localhost:3000/fine-tune/8566c47a-ada8-441c-95bc-7bb07656c4c1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer jvBpxrTNqGqhnfQhSEqCdsG6aTSP8IBL".
```

# TEE Logging

TEE Logging is a feature that allows you to log the activities of your agents. Through these logs, you can verify that the actions of the agents are protected by the TEE and that they are executed autonomously by Eliza, without any third-party interference.

## Setup

You need to setup the TEE log plugin first. Follow the [TEE Log Plugin](../plugin-tee-log/README.md) to setup the plugin.

## Get all TEE agents Information

```bash
curl -X GET --location "http://localhost:3000/tee/agents"
```

Example response when success:

```json
{
    "agents": [
        {
            "id": "f18738bb-edab-45f6-805d-7f26dbfdba87",
            "agentId": "75490f32-c06a-0005-9804-339453d3fe2f",
            "agentName": "tea",
            "createdAt": 1735222963153,
            "publicKey": "02e1a9dde5462ee40bc2df7cc3f0dc88c6e582ea1c4ccf5a30e9dd7fbed736b0fe",
            "attestation": "{\"quote\":\"0x03000200000000000...d2d2d2d0a00\",\"timestamp\":1735222963152}"
        }
    ],
    "attestation": "{\"quote\":\"0x0300020000000...4452d2d2d2d2d0a00\",\"timestamp\":1735223101255}"
}
```

Note that the user report included in the attestation contains the SHA256 hash of the value of the "agents" field. Specifically, it is calculated as follows: `SHA256(JSON.stringify(agents value))`. By verifying the attestation, you can retrieve this hash value and ensure the integrity of the agents' information.


Example response when error:

```json
{
    "error": "Failed to get TEE agents"
}
```

## Get TEE agent Information by agentId

```bash
curl -X GET --location "http://localhost:3000/tee/agents/75490f32-c06a-0005-9804-339453d3fe2f"
```

Example response when success:

```json
{
    "agent": {
        "id": "f18738bb-edab-45f6-805d-7f26dbfdba87",
        "agentId": "75490f32-c06a-0005-9804-339453d3fe2f",
        "agentName": "tea",
        "createdAt": 1735222963153,
        "publicKey": "02e1a9dde5462ee40bc2df7cc3f0dc88c6e582ea1c4ccf5a30e9dd7fbed736b0fe",
        "attestation": "{\"quote\":\"0x0300020...452d2d2d2d2d0a00\",\"timestamp\":1735222963152}"
    },
    "attestation": "{\"quote\":\"0x03000200000000000...d2d2d2d2d0a00\",\"timestamp\":1735223294916}"
}
```

Note that the user report included in the attestation contains the SHA256 hash of the value of the "agent" field. Specifically, it is calculated as follows: `SHA256(JSON.stringify(agent value))`. By verifying the attestation, you can retrieve this hash value and ensure the integrity of the agent's information.

Example response when error:

```json
{
    "error": "Failed to get TEE agent"
}
```

## Get TEE log

```bash
curl -X POST --location "http://localhost:3000/tee/logs" \
    -H "Content-Type: application/json" \
    -d '{
          "query": {
            "agentId": "75490f32-c06a-0005-9804-339453d3fe2f"
          },
          "page": 1,
          "pageSize": 10
        }'
```

There are optional parameters in the `query` parameter:

- **agentId**: (string, optional) The ID of the agent whose logs you want to retrieve.
- **roomId**: (string, optional) The ID of the room associated with the logs.
- **userId**: (string, optional) The ID of the user related to the logs.
- **type**: (string, optional) The type of logs to filter.
- **containsContent**: (string, optional) A substring to search for within the log content.
- **startTimestamp**: (number, optional) The starting timestamp for filtering logs.
- **endTimestamp**: (number, optional) The ending timestamp for filtering logs.


Example response when success:

```json
{
    "logs": {
        "page": 1,
        "pageSize": 10,
        "total": 2,
        "data": [
            {
                "id": "01aac44e-d482-42df-8acc-6e6bfbb798f0",
                "agentId": "75490f32-c06a-0005-9804-339453d3fe2f",
                "roomId": "322d5683-fe3c-056a-8f1a-6b002e0a5c22",
                "userId": "12dea96f-ec20-0935-a6ab-75692c994959",
                "type": "Action:CONTINUE",
                "content": "Continue",
                "timestamp": 1735222998263,
                "signature": "0x304402201a5bd4eb5807293ba0612b835eaaa56742c04603dbe08e3c7d247cdae3dc4b6f022034a165e1d63f1d58cb0976f615f6acd052f5e11154cef76d7c14c8ba99249833"
            },
            {
                "id": "6275e742-3ebf-477c-ab45-99d2c701c4b5",
                "agentId": "75490f32-c06a-0005-9804-339453d3fe2f",
                "roomId": "322d5683-fe3c-056a-8f1a-6b002e0a5c22",
                "userId": "12dea96f-ec20-0935-a6ab-75692c994959",
                "type": "Action:CONTINUE",
                "content": "Continue",
                "timestamp": 1735223036272,
                "signature": "0x304402201a5bd4eb5807293ba0612b835eaaa56742c04603dbe08e3c7d247cdae3dc4b6f022034a165e1d63f1d58cb0976f615f6acd052f5e11154cef76d7c14c8ba99249833"
            }
        ]
    },
    "attestation": "{\"quote\":\"0x0300020000000000...4154452d2d2d2d2d0a00\",\"timestamp\":1735223364956}"
}
```

Note that the user report included in the attestation contains the SHA256 hash of the value of the "logs" field. Specifically, it is calculated as follows: `SHA256(JSON.stringify(logs value))`. By verifying the attestation, you can retrieve this hash value and ensure the integrity of the logs

Example response when error:

```json
{
    "error": "Failed to get TEE logs"
}
```