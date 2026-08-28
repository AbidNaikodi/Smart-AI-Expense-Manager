import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [budget, setBudget] = useState(0);

  // Load Existing Transactions From Backend (runs on every load/refresh)
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetch(`${API_URL}/transactions`);

        if (!response.ok) {
          console.error("Failed to load transactions: HTTP", response.status);
          return;
        }

        const data = await response.json();

        // The Express backend returns a plain array of transactions
        setTransactions(Array.isArray(data) ? data : []);
      } catch (error) {
        // Backend temporarily unavailable — keep the app usable instead of crashing
        console.error("Failed to load transactions:", error);
      }
    };

    loadTransactions();
  }, []);

  // Add Income
  const addIncome = async () => {
    const amount = Number(prompt("Enter income amount:"));
    const category = prompt("Enter income category (example: salary):");

    if (amount > 0 && category) {
      try {
        const response = await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "income", amount, category }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(
            (data && data.error) ||
              "Failed to save income. Please try again."
          );
          return;
        }

        // The backend responds with the saved transaction — use it to update state
        setTransactions([...transactions, data]);
      } catch (error) {
        console.error("Failed to save income:", error);
        alert(
          "Could not reach the backend. Make sure the backend server is running."
        );
      }
    }
  };

  // Add Expense
  const addExpense = async () => {
    const amount = Number(prompt("Enter expense amount:"));
    const category = prompt("Enter expense category (example: food):");

    if (amount > 0 && category) {
      try {
        const response = await fetch(`${API_URL}/transactions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "expense", amount, category }),
        });

        const data = await response.json();

        if (!response.ok) {
          alert(
            (data && data.error) ||
              "Failed to save expense. Please try again."
          );
          return;
        }

        // The backend responds with the saved transaction — use it to update state
        setTransactions([...transactions, data]);
      } catch (error) {
        console.error("Failed to save expense:", error);
        alert(
          "Could not reach the backend. Make sure the backend server is running."
        );
      }
    }
  };

  // Set Monthly Budget
  const setMonthlyBudget = () => {
    const newBudget = Number(prompt("Enter your monthly budget:"));

    if (newBudget > 0) {
      setBudget(newBudget);
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        alert("Failed to delete transaction.");
        return;
      }

      // Remove from state only after the backend confirmed deletion
      setTransactions(
        transactions.filter((transaction) => transaction.id !== id)
      );
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert(
        "Could not reach the backend. Make sure the backend server is running."
      );
    }
  };

  // Reset All Transactions
  const resetExpenses = async () => {
    if (window.confirm("Are you sure you want to reset all transactions?")) {
      try {
        const response = await fetch(`${API_URL}/transactions`, {
          method: "DELETE",
        });

        if (!response.ok) {
          alert("Failed to reset transactions on the backend.");
          return;
        }

        // Clear state only after the backend confirmed the reset
        setTransactions([]);
      } catch (error) {
        console.error("Failed to reset transactions on backend:", error);
        alert(
          "Could not reach the backend. Make sure the backend server is running."
        );
      }
    }
  };

  // Test Backend Connection
  const testBackend = async () => {
    try {
      const response = await fetch(API_URL);

      if (response.ok) {
        alert("Backend connected successfully!");
      } else {
        alert("Backend is running, but there was a connection issue.");
      }
    } catch (error) {
      console.error("Backend connection test failed:", error);
      alert("Backend connection failed. Make sure the backend server is running.");
    }
  };

  // Calculate Total Income
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);

  // Calculate Total Expenses
  const totalExpenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);

  // Calculate Balance
  const balance = totalIncome - totalExpenses;

  // Calculate Expense Percentage
  const expensePercentage =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  // Calculate expenses by category
  const expenseCategories = {};

  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      expenseCategories[transaction.category] =
        (expenseCategories[transaction.category] || 0) +
        transaction.amount;
    });

  // Find Highest Expense Category
  const highestExpenseCategory =
    Object.keys(expenseCategories).length > 0
      ? Object.keys(expenseCategories).reduce((a, b) =>
          expenseCategories[a] > expenseCategories[b] ? a : b
        )
      : "";

  const highestExpenseAmount =
    highestExpenseCategory
      ? expenseCategories[highestExpenseCategory]
      : 0;

  // Smart AI Spending Suggestion
  const getSmartSuggestion = () => {
    if (totalIncome === 0) {
      return "Add your income first to receive personalized spending advice.";
    }

    if (totalExpenses === 0) {
      return "Excellent start! You have not added any expenses yet. Plan your spending wisely and save regularly.";
    }

    // Critical spending
    if (expensePercentage >= 90) {
      return `🚨 Critical! You have spent ${expensePercentage.toFixed(
        1
      )}% of your income. Your remaining balance is ₹${balance}. Avoid unnecessary spending immediately, especially in ${highestExpenseCategory}.`;
    }

    // High spending
    if (expensePercentage >= 70) {
      return `⚠️ Warning! You have spent ${expensePercentage.toFixed(
        1
      )}% of your income. Try reducing your spending, especially in ${highestExpenseCategory}, and protect your remaining ₹${balance}.`;
    }

    // Moderate spending
    if (expensePercentage >= 50) {
      return `🟠 You have spent ${expensePercentage.toFixed(
        1
      )}% of your income. Your spending is becoming high. Monitor your ${highestExpenseCategory} expenses and try to save more.`;
    }

    // Good spending
    return `🟢 Excellent! You have spent only ${expensePercentage.toFixed(
      1
    )}% of your income. Your spending is under control. Continue saving wisely and monitor ${highestExpenseCategory}.`;
  };

  const getFinancialHealth = () => {
    const savings = balance;

    // Not enough data yet — show a neutral score instead of a misleading one
    if (totalIncome === 0 && totalExpenses === 0) {
      return {
        score: 50,
        label: "No Data Yet",
        message:
          "Add your income and expenses to discover your financial health score.",
      };
    }

    // Spending without any recorded income is the highest risk situation
    if (totalIncome === 0) {
      return {
        score: 0,
        label: "Poor",
        message: `🚨 High spending risk! You have spent ₹${totalExpenses} without any recorded income. Add your income to get an accurate score.`,
      };
    }

    const spendingRate = (savings / totalIncome) * 100;

    let score = 50 + spendingRate;

    if (savings < 0) {
      const overspendRate = (-savings / totalIncome) * 100;
      score -= Math.min(40, overspendRate * 2);
    }

    if (budget > 0) {
      if (totalExpenses > budget) {
        const overBudgetRate = ((totalExpenses - budget) / budget) * 100;
        score -= Math.min(20, overBudgetRate * 0.5);
      } else {
        score += 5;
      }
    }

    score = Math.round(Math.min(100, Math.max(0, score)));

    const budgetWarning =
      budget > 0 && totalExpenses > budget
        ? ` You have also exceeded your monthly budget by ₹${totalExpenses - budget}.`
        : "";

    if (score >= 85) {
      return {
        score,
        label: "Excellent",
        message: `🌟 Excellent financial health! You have saved ₹${savings} (${spendingRate.toFixed(
          1
        )}% of your income). Keep up these great saving habits.`,
      };
    }

    if (score >= 60) {
      return {
        score,
        label: "Good",
        message: `👍 Good financial health, but improve your savings. You have saved ₹${savings} so far.${budgetWarning}`,
      };
    }

    if (score >= 40) {
      return {
        score,
        label: "Fair",
        message: `⚠️ Fair financial health. Spending should be reduced — ${expensePercentage.toFixed(
          1
        )}% of your income goes to expenses, especially ${highestExpenseCategory}.${budgetWarning}`,
      };
    }

    return {
      score,
      label: "Poor",
      message: `🚨 Poor financial health — high spending risk! Expenses are using ${expensePercentage.toFixed(
        1
      )}% of your income. Cut back on ${highestExpenseCategory} and save more.${budgetWarning}`,
    };
  };

  const financialHealth = getFinancialHealth();

  // 📈 AI Spending Prediction
  // AI-powered spending analysis and prediction based on historical
  // transaction patterns. This is a simple statistical average model,
  // NOT a trained machine learning model.
  //
  // How the prediction is calculated:
  // 1. Take all recorded expense transactions.
  // 2. Group them by category.
  // 3. For each category, calculate the average amount per transaction —
  //    this represents the user's typical spending level in that category.
  // 4. Assume each category repeats next month at its average level and
  //    add the averages together to estimate next month's total spending.
  const getSpendingPrediction = () => {
    const expenseList = transactions.filter(
      (transaction) => transaction.type === "expense"
    );

    // With fewer than 3 expenses the average would be unreliable,
    // so ask the user for more data instead of guessing
    if (expenseList.length < 3) {
      return {
        enoughData: false,
        message:
          "Add more expense transactions to generate a more accurate spending prediction.",
      };
    }

    // Group expense amounts by category so each category can be analysed
    const amountsByCategory = {};

    expenseList.forEach((transaction) => {
      if (!amountsByCategory[transaction.category]) {
        amountsByCategory[transaction.category] = [];
      }

      amountsByCategory[transaction.category].push(transaction.amount);
    });

    let prediction = 0;
    let highestPredictedCategory = "";
    let highestPredictedAmount = 0;

    Object.keys(amountsByCategory).forEach((category) => {
      const amounts = amountsByCategory[category];

      // Average amount spent per transaction in this category.
      // amounts.length is always >= 1 here, so this never divides by zero.
      const categoryTotal = amounts.reduce(
        (total, amount) => total + amount,
        0
      );
      const categoryAverage = categoryTotal / amounts.length;

      // Every used category is assumed to repeat next month at its
      // average level
      prediction += categoryAverage;

      if (categoryAverage > highestPredictedAmount) {
        highestPredictedAmount = categoryAverage;
        highestPredictedCategory = category;
      }
    });

    // Safety checks: amounts are always positive and counts are >= 3,
    // so prediction cannot be NaN or negative — but guard anyway so no
    // bad value can ever reach the UI
    prediction = Math.max(0, Math.round(prediction || 0));

    return {
      enoughData: true,
      prediction,
      transactionCount: expenseList.length,
      categoryCount: Object.keys(amountsByCategory).length,
      highestPredictedCategory,
      highestPredictedAmount: Math.round(highestPredictedAmount),
    };
  };

  const spendingPrediction = getSpendingPrediction();

  return (
    <div className="app">
      <h1>Smart AI Expense Manager</h1>

      <p className="subtitle">
        Manage your money smarter with AI-powered insights
      </p>

      <div className="balance-section">
        <div className="balance-card total-card">
          <h2>Total Balance</h2>
          <p>₹{balance}</p>
        </div>

        <div className="balance-card income-card">
          <h2>Total Income</h2>
          <p>₹{totalIncome}</p>
        </div>

        <div className="balance-card expense-card">
          <h2>Total Expenses</h2>
          <p>₹{totalExpenses}</p>
        </div>
      </div>

      <div className="button-section">
        <button className="income-btn" onClick={addIncome}>
          + Add Income
        </button>

        <button className="expense-btn" onClick={addExpense}>
          + Add Expense
        </button>
      </div>

      <div className="budget-section">
        <button className="budget-btn" onClick={setMonthlyBudget}>
          🎯 Set Budget
        </button>

        {budget > 0 && <p>Monthly Budget: ₹{budget}</p>}

        {budget > 0 && totalExpenses > budget && (
          <p className="budget-alert">
            ⚠️ Budget Alert! You have exceeded your monthly budget by ₹
            {totalExpenses - budget}.
          </p>
        )}

        <button className="reset-btn" onClick={resetExpenses}>
          Reset Expenses
        </button>
      </div>

      <h2>Transaction History</h2>

      {transactions.length === 0 ? (
        <p>No transactions added yet.</p>
      ) : (
        <div className="transaction-list">
          {transactions.map((transaction) => (
            <div className="transaction-item" key={transaction.id}>
              <span
                className={
                  transaction.type === "income"
                    ? "income-text"
                    : "expense-text"
                }
              >
                {transaction.type === "income" ? "+" : "-"} ₹
                {transaction.amount} — {transaction.category}
              </span>

              <button
                className="delete-btn"
                onClick={() => deleteTransaction(transaction.id)}
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <h2>Expense Summary</h2>

      {Object.keys(expenseCategories).length === 0 ? (
        <p>No expenses added yet.</p>
      ) : (
        <div className="expense-summary">
          {Object.entries(expenseCategories).map(([category, amount]) => (
            <p key={category}>
              <strong>{category}</strong>: ₹{amount}
            </p>
          ))}
        </div>
      )}

      {totalIncome > 0 && (
        <div className="saving-tip">
          💰 You have ₹{balance} remaining. That is{" "}
          {((balance / totalIncome) * 100).toFixed(1)}% of your income.
          Try to save at least 20% of your income.
        </div>
      )}

      {highestExpenseCategory && (
        <div className="ai-insight">
          <h2>🤖 AI Expense Insight</h2>

          <p>
            Your highest expense is <strong>{highestExpenseCategory}</strong>{" "}
            at ₹{highestExpenseAmount}. Consider reducing spending in this
            category.
          </p>
        </div>
      )}

      <div className="smart-suggestion">
        <h2>🧠 Smart Spending Suggestion</h2>
        <p>{getSmartSuggestion()}</p>
      </div>

      <div className={`health-score ${financialHealth.label.toLowerCase()}`}>
        <h2>🤖 AI Financial Health Score</h2>

        <p className="health-score-value">
          Financial Health Score: <strong>{financialHealth.score}/100</strong>
        </p>

        <div className="health-score-bar">
          <div
            className="health-score-fill"
            style={{ width: `${financialHealth.score}%` }}
          ></div>
        </div>

        <span className="health-score-label">{financialHealth.label}</span>

        <p>{financialHealth.message}</p>
      </div>

      <div className="spending-prediction">
        <h2>📈 AI Spending Prediction</h2>

        {spendingPrediction.enoughData ? (
          <>
            <p className="prediction-value">
              Estimated Next Month Spending:{" "}
              <strong>
                ₹{spendingPrediction.prediction.toLocaleString("en-IN")}
              </strong>
            </p>

            <p className="prediction-explanation">
              This AI-powered spending analysis and prediction is based on
              your historical transaction patterns —{" "}
              {spendingPrediction.transactionCount} expense transactions in{" "}
              {spendingPrediction.categoryCount}{" "}
              {spendingPrediction.categoryCount === 1
                ? "category"
                : "categories"}
              , using the average amount spent in each category. Your largest
              predicted category is{" "}
              <strong>{spendingPrediction.highestPredictedCategory}</strong> (₹
              {spendingPrediction.highestPredictedAmount.toLocaleString(
                "en-IN"
              )}
              ).
            </p>
          </>
        ) : (
          <p className="prediction-explanation">{spendingPrediction.message}</p>
        )}
      </div>

      <button className="backend-btn" onClick={testBackend}>
        Test Backend Connection
      </button>
    </div>
  );
}

export default App;