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
            # Legacy image/audio fields for backward compatibility
            image = get_value(new_image.get("image"))
            audio = get_value(new_image.get("audio"))
            files = new_image.get("files")
            if files and 'L' in files:
                file_urls = [get_value(f) for f in files['L']]
            else:
                file_urls = []

            # Construir HTML
            html_body = f"""
            <h2>Nueva tarea creada</h2>
            <p><strong>ID:</strong> {task_id}</p>
            <p><strong>Descripción:</strong> {description}</p>
            <p><strong>Responsable:</strong> {responsible}</p>
            <p><strong>Vence:</strong> {due_date}</p>
            <p><strong>Notas:</strong> {notes}</p>
            """
            # Show all files as links or previews
            if file_urls:
                html_body += '<div><b>Archivos adjuntos:</b><ul>'
                for url in file_urls:
                    if any(url.lower().endswith(ext) for ext in ['.jpg','.jpeg','.png','.gif']):
                        html_body += f'<li><img src="{url}" width="200"/></li>'
                    elif any(url.lower().endswith(ext) for ext in ['.mp3','.wav','.ogg','.webm']):
                        html_body += f'<li><audio src="{url}" controls></audio></li>'
                    else:
                        html_body += f'<li><a href="{url}">{url}</a></li>'
                html_body += '</ul></div>'
            elif image:
                html_body += f'<p><img src="{image}" width="300"/></p>'

            # If audio is present, download and attach
            attachments = []
            import requests
            # Attach all files
            for idx, url in enumerate(file_urls):
                try:
                    resp = requests.get(url)
                    if resp.status_code == 200:
                        # Guess content type from extension
                        ext = url.split('.')[-1].lower()
                        if ext in ['jpg','jpeg','png','gif']:
                            ctype = f'image/{ext if ext != "jpg" else "jpeg"}'
                        elif ext in ['mp3','wav','ogg','webm']:
                            ctype = f'audio/{ext}'
                        else:
                            ctype = 'application/octet-stream'
                        attachments.append({
                            'Name': f'file{idx+1}.{ext}',
                            'Data': resp.content,
                            'ContentType': ctype
                        })
                except Exception as e:
                    print(f"Error downloading file {url}: {e}")
            # Attach legacy audio if not in files and is a valid URL
            def is_valid_url(val):
                return isinstance(val, str) and val.startswith('http')
            if is_valid_url(audio) and audio not in file_urls:
                try:
                    audio_resp = requests.get(audio)
                    if audio_resp.status_code == 200:
                        attachments.append({
                            'Name': 'voice-message.webm',
                            'Data': audio_resp.content,
                            'ContentType': 'audio/webm'
                        })
                except Exception as e:
                    print(f"Error downloading audio {audio}: {e}")

            # Enviar correo
            if attachments:
                import email
                from email.mime.multipart import MIMEMultipart
                from email.mime.text import MIMEText
                from email.mime.base import MIMEBase
                from email import encoders
                msg = MIMEMultipart()
                msg['Subject'] = f"📌 Nueva tarea: {description or task_id}"
                msg['From'] = SENDER_EMAIL
                msg['To'] = RECIPIENT_EMAIL
                msg.attach(MIMEText(html_body, 'html'))
                for att in attachments:
                    part = MIMEBase('audio', 'webm')
                    part.set_payload(att['Data'])
                    encoders.encode_base64(part)
                    part.add_header('Content-Disposition', f'attachment; filename="{att['Name']}"')
                    part.add_header('Content-Type', att['ContentType'])
                    msg.attach(part)
                ses.send_raw_email(
                    Source=SENDER_EMAIL,
                    Destinations=[RECIPIENT_EMAIL],
                    RawMessage={"Data": msg.as_string()}
                )
            else:
                ses.send_email(
                    Source=SENDER_EMAIL,
                    Destination={"ToAddresses": [RECIPIENT_EMAIL]},
                    Message={
                        "Subject": {"Data": f"📌 Nueva tarea: {description or task_id}"},
                        "Body": {"Html": {"Data": html_body}}
                    }
                )

    return {"statusCode": 200}
