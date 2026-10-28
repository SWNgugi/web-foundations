const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusMessage = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

const USERS_URL = "https://jsonplaceholder.typicode.com/users";

let allUsers = [];

function renderUsers(list) {
  usersList.textContent = "";

  if (list.length === 0 && allUsers.length > 0) {
    const empty = document.createElement("li");
    empty.textContent = "No users match your filter.";
    usersList.append(empty);
    return;
  }

  for (const user of list) {
    const li = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const email = document.createElement("div");
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("div");
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement("div");
    company.textContent = `Company: ${user.company.name}`;

    li.append(name, email, city, company);
    usersList.append(li);
  }
}

function applyFilter() {
  const term = filterInput.value.trim().toLowerCase();
  const filtered = allUsers.filter((user) =>
    user.name.toLowerCase().includes(term)
  );
  renderUsers(filtered);
}

async function loadUsers() {
  statusMessage.textContent = "Loading users...";
  loadButton.disabled = true;

  try {
    const response = await fetch(USERS_URL);

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    allUsers = await response.json();
    applyFilter();
    statusMessage.textContent = `Loaded ${allUsers.length} users.`;
  } catch (error) {
    statusMessage.textContent = `Could not load users: ${error.message}`;
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadUsers);
filterInput.addEventListener("input", applyFilter);