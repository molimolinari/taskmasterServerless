const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

const client = new DynamoDBClient();
const dynamo = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const task = {
      id: uuidv4(),
      description: body.description,
      completed: false,
      createdAt: new Date().toISOString()
    };

    await dynamo.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: task
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(task)
    };
  } catch (err) {
    console.error("Error creating task", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Failed to create task" })
    };
  }
};
