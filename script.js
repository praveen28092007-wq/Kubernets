const demoUsers = [
  {
    mobile: "9876543210",
    name: "Aarav Nair",
    vehicles: [
      {
        id: "VH-101",
        registration: "TN 12 AB 4821",
        name: "Toyota Prius",
        type: "Hybrid",
        model: "2023",
        emissionClass: "Euro 6",
        dailyLimit: 60,
        todayDistance: 46,
        totalDistance: 1845,
        maxFineThreshold: 1500,
        fines: [
          { amount: 600, date: "2026-10-16T08:40:00", reason: "Excess emission reading" },
          { amount: 420, date: "2026-10-18T18:12:00", reason: "Unscheduled route violation" }
        ]
      },
      {
        id: "VH-205",
        registration: "TN 19 CD 9124",
        name: "Maruti Swift",
        type: "Petrol",
        model: "2021",
        emissionClass: "BS-IV",
        dailyLimit: 50,
        todayDistance: 18,
        totalDistance: 2110,
        maxFineThreshold: 1800,
        fines: [
          { amount: 350, date: "2026-10-14T09:25:00", reason: "Speed control alert" }
        ]
      }
    ]
  },
  {
    mobile: "8123456789",
    name: "Meera Iyer",
    vehicles: [
      {
        id: "VH-312",
        registration: "KA 03 EF 4308",
        name: "Honda City",
        type: "Petrol",
        model: "2022",
        emissionClass: "Euro 5",
        dailyLimit: 55,
        todayDistance: 55,
        totalDistance: 3960,
        maxFineThreshold: 2000,
        fines: [
          { amount: 900, date: "2026-10-15T07:10:00", reason: "High CO2 level" },
          { amount: 650, date: "2026-10-18T12:05:00", reason: "Vehicle inspection alert" },
          { amount: 520, date: "2026-10-20T15:40:00", reason: "Over-limit emission below standard" }
        ]
      }
    ]
  },
  {
    mobile: "9012345678",
    name: "Rohit Sethi",
    vehicles: [
      {
        id: "VH-490",
        registration: "MH 24 GH 6201",
        name: "Tata Nexon EV",
        type: "Electric",
        model: "2024",
        emissionClass: "Zero-emission",
        dailyLimit: 70,
        todayDistance: 34,
        totalDistance: 2875,
        maxFineThreshold: 1200,
        fines: [
          { amount: 210, date: "2026-10-17T10:20:00", reason: "Charging station delay" }
        ]
      },
      {
        id: "VH-499",
        registration: "MH 24 PL 1990",
        name: "Kia Seltos",
        type: "Diesel",
        model: "2021",
        emissionClass: "BS-VI",
        dailyLimit: 40,
        todayDistance: 28,
        totalDistance: 1324,
        maxFineThreshold: 1600,
        fines: [
          { amount: 480, date: "2026-10-19T16:55:00", reason: "Nitrogen oxide spike" }
        ]
      }
    ]
  }
];

const STORAGE_KEY = "carboncare-demo-user";

const loginScreen = document.getElementById("loginScreen");
const dashboardScreen = document.getElementById("dashboardScreen");
const loginForm = document.getElementById("loginForm");
const mobileNumberInput = document.getElementById("mobileNumber");
const logoutBtn = document.getElementById("logoutBtn");
const vehicleList = document.getElementById("vehicleList");
const alertPanel = document.getElementById("alertPanel");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function dateTimeLabel(dateValue) {
  const date = new Date(dateValue);
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getSessionUser() {
  const savedUser = localStorage.getItem(STORAGE_KEY);
  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch {
    return null;
  }
}

function saveSessionUser(user) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

function getVehicleFineTotal(vehicle) {
  return vehicle.fines.reduce((sum, fine) => sum + Number(fine.amount || 0), 0);
}

function getAlertText(vehicle) {
  const fineTotal = getVehicleFineTotal(vehicle);
  if (fineTotal >= vehicle.maxFineThreshold) {
    return {
      type: "warning",
      message: `Fine limit exceeded for ${vehicle.registration}. Notifications paused for this vehicle.`
    };
  }

  if (vehicle.todayDistance >= vehicle.dailyLimit) {
    return {
      type: "danger",
      message: `Daily limit reached for ${vehicle.registration}. Driving allotment trigger activated.`
    };
  }

  if (vehicle.todayDistance >= vehicle.dailyLimit * 0.8) {
    return {
      type: "info",
      message: `${vehicle.registration} is nearing its daily driving limit.`
    };
  }

  return null;
}

function renderAlerts(user) {
  const alerts = [];

  user.vehicles.forEach((vehicle) => {
    const alert = getAlertText(vehicle);
    if (alert) {
      alerts.push({ ...alert, vehicle: vehicle.name });
    }
  });

  if (!alerts.length) {
    alertPanel.innerHTML = `<div class="alert-box success"><strong>All clear.</strong> No vehicle is above the active threshold.</div>`;
    return 0;
  }

  alertPanel.innerHTML = alerts
    .map(
      (alert) => `
        <div class="alert-box ${alert.type}">
          <strong>${alert.vehicle}</strong>
          <span>${alert.message}</span>
        </div>
      `
    )
    .join("");

  return alerts.length;
}

function renderDashboard() {
  const user = getSessionUser();
  if (!user) {
    showLogin();
    return;
  }

  showDashboard();

  const totalVehicles = user.vehicles.length;
  const totalDistance = user.vehicles.reduce((sum, vehicle) => sum + Number(vehicle.totalDistance || 0), 0);
  const totalFees = user.vehicles.reduce((sum, vehicle) => sum + getVehicleFineTotal(vehicle), 0);
  const alertCount = renderAlerts(user);

  document.getElementById("totalVehicles").textContent = String(totalVehicles);
  document.getElementById("totalDistanceSummary").textContent = `${totalDistance.toLocaleString("en-IN")} km`;
  document.getElementById("totalFineSummary").textContent = formatCurrency(totalFees);
  document.getElementById("alertCount").textContent = String(alertCount);

  vehicleList.innerHTML = user.vehicles
    .map((vehicle) => {
      const fineTotal = getVehicleFineTotal(vehicle);
      const percentUsed = Math.min((vehicle.todayDistance / vehicle.dailyLimit) * 100, 100);
      const notificationPaused = fineTotal >= vehicle.maxFineThreshold;
      const nearLimit = vehicle.todayDistance >= vehicle.dailyLimit * 0.8;
      const capReached = vehicle.todayDistance >= vehicle.dailyLimit;

      return `
        <article class="vehicle-card ${capReached ? "cap-reached" : nearLimit ? "near-limit" : ""}">
          <div class="vehicle-header">
            <div>
              <div class="vehicle-name">${vehicle.name}</div>
              <div class="vehicle-reg">${vehicle.registration}</div>
            </div>
            <span class="status-badge ${notificationPaused ? "cease" : "active"}">
              ${notificationPaused ? "Cease notification" : "Alerts active"}
            </span>
          </div>

          <div class="vehicle-meta">
            <span><strong>Type:</strong> ${vehicle.type}</span>
            <span><strong>Model:</strong> ${vehicle.model}</span>
            <span><strong>Emission:</strong> ${vehicle.emissionClass}</span>
            <span><strong>ID:</strong> ${vehicle.id}</span>
          </div>

          <div class="distance-panel">
            <div class="distance-row">
              <span>Today</span>
              <strong>${vehicle.todayDistance} / ${vehicle.dailyLimit} km</strong>
            </div>
            <div class="distance-row">
              <span>Total since start</span>
              <strong>${vehicle.totalDistance} km</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${percentUsed}%"></div>
            </div>
          </div>

          <div class="vehicle-status-message">
            ${capReached
              ? "Daily driving limit reached. Alternative allotment recommended."
              : nearLimit
                ? "Close to today's distance cap. Moderate driving is advised."
                : "Driving remains within the allowed target range."}
          </div>

          <div class="fine-box">
            <div class="fine-header">
              <h3>Fines & notifications</h3>
              <span>${formatCurrency(fineTotal)}</span>
            </div>

            <div class="fine-list">
              ${vehicle.fines.length
                ? vehicle.fines
                    .map(
                      (fine) => `
                        <div class="fine-item">
                          <span class="fine-reason">${fine.reason}</span>
                          <span class="fine-meta">${formatCurrency(fine.amount)} • ${dateTimeLabel(fine.date)}</span>
                        </div>
                      `
                    )
                    .join("")
                : '<div class="fine-item"><span class="fine-reason">No fines recorded</span></div>'}
            </div>
          </div>

          <div class="vehicle-actions">
            <button class="action-btn secondary" type="button" data-action="drive" data-vehicle-id="${vehicle.id}">Add trip</button>
            <button class="action-btn primary" type="button" data-action="fine" data-vehicle-id="${vehicle.id}">Add fine</button>
          </div>
        </article>
      `;
    })
    .join("");

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleVehicleAction(button.dataset.action, button.dataset.vehicleId);
    });
  });
}

function handleVehicleAction(action, vehicleId) {
  const user = getSessionUser();
  if (!user) {
    return;
  }

  const vehicle = user.vehicles.find((item) => item.id === vehicleId);
  if (!vehicle) {
    return;
  }

  if (action === "drive") {
    if (vehicle.todayDistance >= vehicle.dailyLimit) {
      alert("Today's driving cap is already reached. Please allot another vehicle or switch to a lower-emission option.");
      return;
    }

    const nextDistance = Math.min(vehicle.todayDistance + 8, vehicle.dailyLimit);
    vehicle.todayDistance = nextDistance;
    vehicle.totalDistance += 8;
  }

  if (action === "fine") {
    const fineAmount = 300 + Math.floor(Math.random() * 700);
    vehicle.fines.push({
      amount: fineAmount,
      date: new Date().toISOString(),
      reason: ["Emission threshold exceed", "Vehicle inspection alert", "Idle engine violation", "Route compliance alert"][Math.floor(Math.random() * 4)]
    });
  }

  saveSessionUser(user);
  renderDashboard();
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  dashboardScreen.classList.add("hidden");
  logoutBtn.classList.add("hidden");
}

function showDashboard() {
  loginScreen.classList.add("hidden");
  dashboardScreen.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const mobile = mobileNumberInput.value.trim();
  if (!/^\d{10}$/.test(mobile)) {
    alert("Please enter a valid 10-digit mobile number.");
    return;
  }

  const user = demoUsers.find((entry) => entry.mobile === mobile);
  if (!user) {
    alert("No registered vehicle account found for this mobile number.");
    return;
  }

  saveSessionUser(user);
  renderDashboard();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  showLogin();
  mobileNumberInput.value = "";
});

const existingSession = getSessionUser();
if (existingSession) {
  renderDashboard();
} else {
  showLogin();
}
