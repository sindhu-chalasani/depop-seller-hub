def main(event, context):
    #proving S3 event wiring works
    print("S3 event:", event)
    return {"ok": True}
