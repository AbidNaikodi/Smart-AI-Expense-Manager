const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const dataFilePath = path.join(__dirname, "transactions.json");

// Create transactions.json if it does not exist
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([]));
}

// Read transactions from file
function getTransactions() {
  try {
    const data = fs.readFileSync(dataFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Save transactions to file
function saveTransactions(transactions) {
  fs.writeFileSync(
    dataFilePath,
    JSON.stringify(transactions, null, 2)
  );
}

// Home route
app.get("/", (req, res) => {
  res.send("Smart Expense AI Backend is Running!");
});

// Get all transactions
app.get("/transactions", (req, res) => {
  const transactions = getTransactions();
  res.json(transactions);
});

// Add a new transaction
app.post("/transactions", (req, res) => {
  const transactions = getTransactions();

  const newTransaction = {
    id: Date.now(),
    ...req.body,
  };

  transactions.push(newTransaction);
  saveTransactions(transactions);

  res.status(201).json(newTransaction);
});

// Delete a transaction
app.delete("/transactions/:id", (req, res) => {
  const transactions = getTransactions();

  const id = Number(req.params.id);

  const updatedTransactions = transactions.filter(
    (transaction) => transaction.id !== id
  );

  saveTransactions(updatedTransactions);

  res.json({
    message: "Transaction deleted successfully!",
  });
});

// Reset all transactions
app.delete("/transactions", (req, res) => {
  saveTransactions([]);

  res.json({
    message: "All transactions reset successfully!",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});