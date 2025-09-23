const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  console.log("EVENTO RECIBidO:", JSON.stringify(event, null, 2));
  try {
    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);

    await dynamo.send(new UpdateCommand({
      TableName: process.env.TABLE_NAME,
      Key: { id: id },
      UpdateExpression: "set completed = :c",
      ExpressionAttributeValues: { ":c": body.completed },
      ReturnValues: "ALL_NEW"
    }));

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ message: "Task updated", id })
    };
  } catch (err) {
    console.error("Error updating task", err);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
        "Access-Control-Allow-Headers": "Content-Type"
      },
      body: JSON.stringify({ error: "Failed to update task" })
    };
  }
};
