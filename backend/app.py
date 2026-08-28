import json
import os

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# Allow the React frontend (different port) to call this API
CORS(app)

# Store transactions in a simple JSON file so data survives restarts
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "transactions.json")


# Load all transactions from the JSON file
def load_transactions():
    if not os.path.exists(DATA_FILE):
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            return json.load(file)
    except (json.JSONDecodeError, OSError):
        return []


# Save all transactions back to the JSON file
def save_transactions(transactions):
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(transactions, file, indent=2)


# 1. Health check — confirms the backend is running
@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Backend is running"})


# 2. Return all transactions
@app.get("/api/transactions")
def get_transactions():
    return jsonify({"transactions": load_transactions()})


# 3. Add a new income or expense transaction
@app.post("/api/transactions")
def add_transaction():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be valid JSON"}), 400

    transaction_type = str(data.get("type", "")).lower()
    category = str(data.get("category", "")).strip()

    try:
        amount = float(data.get("amount"))
    except (TypeError, ValueError):
        return jsonify({"error": "Amount must be a number"}), 400

    if transaction_type not in ("income", "expense"):
        return jsonify({"error": "Type must be 'income' or 'expense'"}), 400

    if amount <= 0:
        return jsonify({"error": "Amount must be greater than 0"}), 400

    if not category:
        return jsonify({"error": "Category is required"}), 400

    transactions = load_transactions()

    new_transaction = {
        "id": max((t["id"] for t in transactions), default=0) + 1,
        "type": transaction_type,
        "amount": round(amount, 2),
        "category": category,
    }

    transactions.append(new_transaction)
    save_transactions(transactions)

    return (
        jsonify(
            {
                "message": "Transaction added successfully",
                "transaction": new_transaction,
            }
        ),
        201,
    )


# 4. Delete a transaction by id
@app.delete("/api/transactions/<int:transaction_id>")
def delete_transaction(transaction_id):
    transactions = load_transactions()

    remaining = [t for t in transactions if t["id"] != transaction_id]

    if len(remaining) == len(transactions):
        return jsonify({"error": "Transaction not found"}), 404

    save_transactions(remaining)

    return jsonify({"message": f"Transaction {transaction_id} deleted"})


if __name__ == "__main__":
    # Port 5001 — port 5000 is already used by another app on this machine
    app.run(debug=True, port=5001)
