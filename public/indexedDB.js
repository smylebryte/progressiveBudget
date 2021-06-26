let db;

// Create a new db request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (e) {
  console.log("Upgrade needed in IndexDB");

  db = e.target.result;

  db.createObjectStore("BudgetStore", { autoIncrement: true });
};

request.onsuccess = (e) => {
  db = e.target.result;
  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log("check db invoked");

  // Open a transaction on your BudgetStore db
  const transaction = db.transaction(["BudgetStore"], "readwrite");

  // access your BudgetStore object
  const store = transaction.objectStore("BudgetStore");

  // Get all records from store and set to a variable
  const getAll = store.getAll();

  // If the request was successful
  getAll.onsuccess = function () {
    // If there are items in the store, we need to bulk add them when we are back online
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // Open another transaction to BudgetStore with the ability to read and write
          const transaction = db.transaction(["BudgetStore"], "readwrite");

          // Assign the current store to a variable
          const currentStore = transaction.objectStore("BudgetStore");

          // Clear existing entries because our bulk add was successful
          currentStore.clear();
          console.log("Clearing store 🧹");
        });
    }
  };
}

const saveRecord = (record) => {
  console.log("Save record invoked");
  // Create a transaction on the BudgetStore db with readwrite access
  const transaction = db.transaction(["BudgetStore"], "readwrite");

  // Access your BudgetStore object store
  const store = transaction.objectStore("BudgetStore");

  // Add record to your store with add method.
  store.add(record);
};

// Listen for app coming back online
window.addEventListener("online", checkDatabase);
