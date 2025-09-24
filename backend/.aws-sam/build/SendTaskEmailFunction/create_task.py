import json
import boto3
import os
import uuid
from datetime import datetime

dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(os.environ["TABLE_NAME"])

def handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))
        
        task_id = str(uuid.uuid4())
        task_item = {
            "id": str(uuid.uuid4()),
            "description": body.get("description", ""),
            "responsible": body.get("responsible", ""),
            "dueDate": body.get("dueDate", ""),
            "notes": body.get("notes", ""),
            "image": body.get("image", ""),   # URL de S3 (si viene del frontend)
            "completed": False,
            "createdAt": datetime.utcnow().isoformat()
        }

        # Guardar en DynamoDB
        table.put_item(Item=task_item)

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",  # <-- Habilita CORS
                "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps(task_item)
        }
    except Exception as e:
        print(f"Error creating task: {e}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": "Failed to create task"})
        }
