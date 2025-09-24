const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async () => {
  try {
    const result = await dynamo.send(new ScanCommand({
      TableName: process.env.TABLE_NAME
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result.Items)
    };
  } catch (err) {
    console.error("Error listing tasks", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to list tasks" })
    };
  }
};
