import boto3
import os

ses = boto3.client("ses")
SENDER_EMAIL = os.environ["SENDER_EMAIL"]
RECIPIENT_EMAIL = os.environ["RECIPIENT_EMAIL"]

def handler(event, context):
    for record in event["Records"]:
        if record["eventName"] == "INSERT":
            new_image = record["dynamodb"]["NewImage"]

            # Mapear valores (algunos pueden venir como dict {S: "value"})
            def get_value(attr):
                return list(attr.values())[0] if attr else ""

            task_id = get_value(new_image.get("id"))
            description = get_value(new_image.get("description"))
            responsible = get_value(new_image.get("responsible"))
            due_date = get_value(new_image.get("due_date"))
            notes = get_value(new_image.get("notes"))
            image = get_value(new_image.get("image"))

            # Construir HTML
            html_body = f"""
            <h2>Nueva tarea creada</h2>
            <p><strong>ID:</strong> {task_id}</p>
            <p><strong>Descripción:</strong> {description}</p>
            <p><strong>Responsable:</strong> {responsible}</p>
            <p><strong>Vence:</strong> {due_date}</p>
            <p><strong>Notas:</strong> {notes}</p>
            """
            if image:
                html_body += f'<p><img src="{image}" width="300"/></p>'

            # Enviar correo
            ses.send_email(
                Source=SENDER_EMAIL,
                Destination={"ToAddresses": [RECIPIENT_EMAIL]},
                Message={
                    "Subject": {"Data": f"📌 Nueva tarea: {description or task_id}"},
                    "Body": {"Html": {"Data": html_body}}
                }
            )

    return {"statusCode": 200}
