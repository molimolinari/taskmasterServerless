import boto3
import os
import json
import uuid

s3 = boto3.client("s3")
BUCKET_NAME = os.environ.get("IMAGES_BUCKET")

def handler(event, context):
    print("Evento recibido:", json.dumps(event))  # 👈 Log completo
    try:
        qs = event.get("queryStringParameters") or {}
        file_name = qs.get("filename", str(uuid.uuid4()))

        file_type = qs.get("fileType", "image/jpeg")

        presigned_url = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": BUCKET_NAME,
                "Key": file_name,
                "ContentType": file_type
            },
            ExpiresIn=300  # 5 minutos
        )

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "uploadUrl": presigned_url,
                "fileUrl": f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}"
            })
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
