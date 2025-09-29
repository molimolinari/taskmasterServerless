import json
import boto3
import os

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])

def handler(event, context):
    task_id = event["pathParameters"]["id"]
    try:
        body = json.loads(event.get("body", "{}"))
        update_expr = []
        expr_attr_vals = {}
        # Only allow updating 'completed' or 'canceled' status
        if "completed" in body:
            update_expr.append("completed = :c")
            expr_attr_vals[":c"] = body["completed"]
        if "canceled" in body:
            update_expr.append("canceled = :x")
            expr_attr_vals[":x"] = body["canceled"]
        if not update_expr:
            return {"statusCode": 400, "body": json.dumps({"error": "No valid fields to update"})}
        update_expr_str = "SET " + ", ".join(update_expr)
        table.update_item(
            Key={"id": task_id},
            UpdateExpression=update_expr_str,
            ExpressionAttributeValues=expr_attr_vals
        )
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"message": "Task updated"})
        }
    except Exception as e:
        print(f"Error updating task: {e}")
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Failed to update task"})
        }
