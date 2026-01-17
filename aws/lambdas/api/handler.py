import json

def main(event, context):
    path = event.get("rawPath", "")
    if path == "/kpis":
        return {
            "statusCode": 200,
            "headers": {"content-type": "application/json"},
            "body": json.dumps({"gmv_cents": 0, "profit_cents": 0, "units_sold": 0}),
        }

    if path == "/presign":
        return {
            "statusCode": 200,
            "headers": {"content-type": "application/json"},
            "body": json.dumps({"uploadUrl": "stub", "key": "stub"}),
        }

    return {"statusCode": 404, "body": "not found"}
