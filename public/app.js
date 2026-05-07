const sampleDoctors = [
  {
    _id: "sample-1",
    firstName: "Amina",
    lastName: "Kareem",
    specialization: "Family Medicine",
    experience: "8 years",
    consultationFees: 1800,
    address: "Westlands Medical Centre",
    timings: ["09:00", "17:00"],
    phoneNumber: "254700000001",
  },
  {
    _id: "sample-2",
    firstName: "Brian",
    lastName: "Otieno",
    specialization: "Cardiology",
    experience: "12 years",
    consultationFees: 3500,
    address: "Upper Hill Clinic",
    timings: ["10:00", "16:00"],
    phoneNumber: "254700000002",
  },
  {
    _id: "sample-3",
    firstName: "Leah",
    lastName: "Mwangi",
    specialization: "Dermatology",
    experience: "6 years",
    consultationFees: 2200,
    address: "Karen Specialist Suites",
    timings: ["08:30", "15:30"],
    phoneNumber: "254700000003",
  },
];

const state = {
  doctors: [],
  allPractitioners: [],
  users: [],
  adminReviewFilter: "all",
  practitionerApplication: null,
  selectedAdminUser: null,
  appointments: JSON.parse(localStorage.getItem("appointmentDrafts") || "[]"),
  user: null,
  selectedDoctor: null,
  accountMode: "login",
  pendingVerificationEmail: localStorage.getItem("pendingVerificationEmail") || "",
  token: localStorage.getItem("appointmentToken") || "",
};

const authView = document.querySelector("#authView");
const appView = document.querySelector("#appView");
const toastRegion = document.querySelector("#toastRegion");
const doctorGrid = document.querySelector("#doctorGrid");
const doctorSearch = document.querySelector("#doctorSearch");
const doctorCount = document.querySelector("#doctorCount");
const apiState = document.querySelector("#apiState");
const refreshButton = document.querySelector("#refreshButton");
const bookingModal = document.querySelector("#bookingModal");
const bookingForm = document.querySelector("#bookingForm");
const bookingTitle = document.querySelector("#bookingTitle");
const bookingStatus = document.querySelector("#bookingStatus");
const closeBooking = document.querySelector("#closeBooking");
const accountForm = document.querySelector("#account");
const accountStatus = document.querySelector("#accountStatus");
const accountButton = document.querySelector("#accountButton");
const resendOtpButton = document.querySelector("#resendOtpButton");
const passwordToggle = document.querySelector("#passwordToggle");
const passwordInput = accountForm.querySelector("input[name='password']");
const dashboardName = document.querySelector("#dashboardName");
const dashboardEmail = document.querySelector("#dashboardEmail");
const accountChip = document.querySelector("#accountChip");
const sidebarAvatar = document.querySelector("#sidebarAvatar");
const sidebarUserName = document.querySelector("#sidebarUserName");
const dashboardDoctorCount = document.querySelector("#dashboardDoctorCount");
const dashboardAppointmentCount = document.querySelector("#dashboardAppointmentCount");
const dashboardNotificationCount = document.querySelector("#dashboardNotificationCount");
const dashboardDoctorGrid = document.querySelector("#dashboardDoctorGrid");
const dashboardAllDoctors = document.querySelector("#dashboardAllDoctors");
const dashboardNotifications = document.querySelector("#dashboardNotifications");
const allNotifications = document.querySelector("#allNotifications");
const dashboardAppointments = document.querySelector("#dashboardAppointments");
const dashboardRefreshButton = document.querySelector("#dashboardRefreshButton");
const logoutButton = document.querySelector("#logoutButton");
const profileName = document.querySelector("#profileName");
const profileEmail = document.querySelector("#profileEmail");
const profilePhone = document.querySelector("#profilePhone");
const homePrimaryTitle = document.querySelector("#homePrimaryTitle");
const homeSecondaryTitle = document.querySelector("#homeSecondaryTitle");
const practitionerForm = document.querySelector("#practitionerForm");
const practitionerStatus = document.querySelector("#practitionerStatus");
const adminReviewList = document.querySelector("#adminReviewList");
const adminUserCount = document.querySelector("#adminUserCount");
const adminPendingCount = document.querySelector("#adminPendingCount");
const adminVerifiedCount = document.querySelector("#adminVerifiedCount");
const adminAnalyticsList = document.querySelector("#adminAnalyticsList");
const adminUsageChart = document.querySelector("#adminUsageChart");
const adminMonitoringList = document.querySelector("#adminMonitoringList");
const adminUsersList = document.querySelector("#adminUsersList");
const userModal = document.querySelector("#userModal");
const closeUserModal = document.querySelector("#closeUserModal");
const userModalAvatar = document.querySelector("#userModalAvatar");
const userModalName = document.querySelector("#userModalName");
const userModalEmail = document.querySelector("#userModalEmail");
const userModalPhone = document.querySelector("#userModalPhone");
const userModalRole = document.querySelector("#userModalRole");
const userModalVerified = document.querySelector("#userModalVerified");
const userModalActive = document.querySelector("#userModalActive");
const userModalLastLogin = document.querySelector("#userModalLastLogin");
const userModalLoginCount = document.querySelector("#userModalLoginCount");
const toggleUserStatusButton = document.querySelector("#toggleUserStatusButton");

const money = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

function initials(doctor) {
  return `${doctor.firstName?.[0] || ""}${doctor.lastName?.[0] || ""}`.toUpperCase() || "DR";
}

function initialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase() || "U";
}

function doctorName(doctor) {
  return `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim();
}

function statusLabel(status) {
  const labels = {
    pending: "Pending review",
    verified: "Verified",
    rejected: "Rejected",
    expired: "Expired",
  };
  return labels[status] || "Not applied";
}

function statusBadge(status) {
  return `<span class="status-pill status-${status || "pending"}">${statusLabel(status)}</span>`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date;
}

function sameDay(a, b) {
  if (!a || !b) return false;
  const first = new Date(a);
  const second = new Date(b);
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function countByDay(items, field, days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const day = daysAgo(days - index - 1);
    return {
      label: day.toLocaleDateString("en-KE", { weekday: "short" }),
      count: items.filter((item) => sameDay(item[field], day)).length,
    };
  });
}

function linePoints(series, maxValue, width = 700, height = 260, padding = { top: 28, right: 24, bottom: 52, left: 58 }) {
  const usableWidth = width - padding.left - padding.right;
  const usableHeight = height - padding.top - padding.bottom;
  return series.map((item, index) => {
    const x = padding.left + (usableWidth / Math.max(1, series.length - 1)) * index;
    const y = height - padding.bottom - (item.count / maxValue) * usableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `form-status ${type}`.trim();
}

function toast(title, message = "", type = "success") {
  const item = document.createElement("div");
  const toastType = type === "error" ? "warn" : type;
  item.className = `toast ${toastType}`.trim();
  const titleElement = document.createElement("strong");
  titleElement.textContent = title;
  item.append(titleElement);
  if (message) {
    const messageElement = document.createElement("span");
    messageElement.textContent = message;
    item.append(messageElement);
  }
  toastRegion.append(item);
  window.setTimeout(() => item.remove(), 4200);
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || data.error || "Request failed");
    error.data = data.data;
    throw error;
  }

  return data;
}

function renderDoctors() {
  const query = doctorSearch.value.trim().toLowerCase();
  const doctors = state.doctors.filter((doctor) => {
    const haystack = [
      doctorName(doctor),
      doctor.specialization,
      doctor.address,
      doctor.experience,
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  doctorCount.textContent = `${state.doctors.length} verified ${state.doctors.length === 1 ? "practitioner" : "practitioners"}`;

  if (!doctors.length) {
    doctorGrid.innerHTML = '<div class="empty-state">No doctors match that search.</div>';
    return;
  }

  doctorGrid.innerHTML = doctors
    .map((doctor, index) => {
      const timings = Array.isArray(doctor.timings) ? doctor.timings.join(" - ") : "Flexible hours";
      return `
        <article class="doctor-card" style="animation-delay: ${index * 70}ms">
          <div class="doctor-top">
            <span class="avatar">${initials(doctor)}</span>
            <div>
              <h3>${doctorName(doctor)}</h3>
              <p>${doctor.specialization || "General Practice"}</p>
            </div>
          </div>
          <p>${doctor.address || "Clinic address available after booking."}</p>
          <div class="badges">
            <span class="badge">${doctor.experience || "Experienced"}</span>
            <span class="badge">${money.format(Number(doctor.consultationFees || 0))}</span>
            <span class="badge">${timings}</span>
          </div>
          <button class="primary-button full" type="button" data-book="${doctor._id}">Book appointment</button>
        </article>
      `;
    })
    .join("");
}

function renderDoctorRows(target, doctors) {
  if (!doctors.length) {
    target.innerHTML = '<div class="empty-state">No verified practitioners yet.</div>';
    return;
  }

  target.innerHTML = doctors
    .map((doctor) => `
      <article class="doctor-row">
        <span class="avatar">${initials(doctor)}</span>
        <div>
          <strong>${doctorName(doctor)}</strong>
          <p>${doctor.specialization || "General Practice"} · ${money.format(Number(doctor.consultationFees || 0))}</p>
        </div>
        <button class="mini-button" type="button" data-book="${doctor._id}">Book</button>
      </article>
    `)
    .join("");
}

function renderDashboardDoctorCards() {
  if (!state.doctors.length) {
    dashboardAllDoctors.innerHTML = '<div class="empty-state">No verified practitioners yet.</div>';
    return;
  }

  dashboardAllDoctors.innerHTML = state.doctors
    .map((doctor, index) => {
      const timings = Array.isArray(doctor.timings) ? doctor.timings.join(" - ") : "Flexible hours";
      return `
        <article class="doctor-card" style="animation-delay: ${index * 70}ms">
          <div class="doctor-top">
            <span class="avatar">${initials(doctor)}</span>
            <div>
              <h3>${doctorName(doctor)}</h3>
              <p>${doctor.specialization || "General Practice"}</p>
            </div>
          </div>
          <p>${doctor.address || "Clinic address available after booking."}</p>
          <div class="badges">
            <span class="badge">${doctor.experience || "Experienced"}</span>
            ${statusBadge(doctor.status)}
            <span class="badge">${money.format(Number(doctor.consultationFees || 0))}</span>
            <span class="badge">${timings}</span>
          </div>
          <button class="primary-button full" type="button" data-book="${doctor._id}">Book appointment</button>
        </article>
      `;
    })
    .join("");
}

function getNotifications() {
  const unseen = state.user?.unseenNotifications || [];
  const seen = state.user?.seenNotifications || [];
  const base = [...unseen, ...seen];

  if (!base.length) {
    return [
      {
        message: "Your account is ready. Pick a specialist and request your first visit.",
        type: "Ready to book",
      },
    ];
  }

  return base;
}

function renderNotifications() {
  const notifications = getNotifications();
  const markup = notifications
    .map((notification) => `
      <article class="activity-row">
        <strong>${notification.type || "Care update"}</strong>
        <p>${notification.message || "You have a new update."}</p>
      </article>
    `)
    .join("");

  dashboardNotifications.innerHTML = markup;
  allNotifications.innerHTML = markup;
}

function renderAppointments() {
  if (!state.appointments.length) {
    dashboardAppointments.innerHTML = '<div class="empty-state">No appointment requests yet. Book a doctor to start.</div>';
    return;
  }

  dashboardAppointments.innerHTML = state.appointments
    .map((appointment) => `
      <article class="activity-row">
        <div>
          <strong>${appointment.doctorName}</strong>
          <p>${appointment.date} at ${appointment.time} · ${appointment.reason || "General consultation"}</p>
        </div>
        <span class="status-pill">${appointment.status}</span>
      </article>
    `)
    .join("");
}

function renderDashboard() {
  const userName = state.user?.name || "Patient";
  const email = state.user?.email || "";
  const phone = state.user?.phoneNumber || "-";
  const notifications = getNotifications();
  const isAdmin = Boolean(state.user?.isAdmin);

  dashboardName.textContent = isAdmin ? "Operations control" : `Good to see you, ${userName.split(" ")[0] || "there"}`;
  dashboardEmail.textContent = isAdmin
    ? "Review practitioner credentials, monitor activity, and keep the platform tidy."
    : state.appointments.length
      ? "Track your visit requests and book follow-up care when you need it."
      : "You are ready to book. Choose a specialist below to request your first visit.";
  accountChip.textContent = email || "Signed in";
  sidebarAvatar.textContent = initialsFromName(userName);
  sidebarUserName.textContent = userName;
  dashboardDoctorCount.textContent = String(isAdmin ? state.allPractitioners.length : state.doctors.length);
  dashboardAppointmentCount.textContent = String(isAdmin ? state.allPractitioners.filter((item) => item.status === "pending").length : state.appointments.length);
  dashboardNotificationCount.textContent = String(isAdmin ? state.users.length : notifications.length);
  profileName.textContent = userName;
  profileEmail.textContent = email || "-";
  profilePhone.textContent = phone;
  document.querySelectorAll("[data-role-menu='admin']").forEach((item) => item.classList.toggle("hidden", !isAdmin));
  document.querySelectorAll("[data-role-menu='patient']").forEach((item) => item.classList.toggle("hidden", isAdmin));
  homePrimaryTitle.textContent = isAdmin ? "Practitioners awaiting review" : "Start with these specialists";
  homeSecondaryTitle.textContent = isAdmin ? "Operations guide" : "What needs your attention";

  renderHomeContent(isAdmin);
  renderDashboardDoctorCards();
  renderNotifications();
  renderAppointments();
  renderPractitionerApplication();
  renderAdminReviews();
  renderAdminAnalytics();
  renderAdminMonitoring();
  renderAdminUsers();
}

async function loadDoctors() {
  apiState.textContent = "Loading verified practitioners...";
  doctorGrid.innerHTML = '<div class="empty-state">Loading doctors...</div>';

  try {
    const data = await api("/api/user/get-all-approved-doctors");
    state.doctors = data.data?.length ? data.data : sampleDoctors;
    apiState.textContent = data.data?.length
      ? "Connected to live appointment data."
      : "Connected. Showing sample doctors until approvals are added.";
  } catch (error) {
    state.doctors = sampleDoctors;
    apiState.textContent = "API is reachable after MongoDB is configured. Showing sample doctors for now.";
  }

  renderDoctors();
  renderDashboard();
}

async function loadUserProfile() {
  const data = await api("/api/user/get-user-by-id", {
    method: "POST",
    body: JSON.stringify({}),
  });
  state.user = data.data;

  try {
    const doctorData = await api("/api/doctor/get-doctor-info-by-user-id", {
      method: "POST",
      body: JSON.stringify({}),
    });
    state.practitionerApplication = doctorData.data;
  } catch (error) {
    state.practitionerApplication = null;
  }

  if (state.user?.isAdmin) {
    try {
      const reviewData = await api("/api/admin/get-all-doctors");
      state.allPractitioners = reviewData.data || [];
    } catch (error) {
      state.allPractitioners = [];
    }
    try {
      const usersData = await api("/api/admin/get-all-users");
      state.users = usersData.data || [];
    } catch (error) {
      state.users = [];
    }
  }
}

function renderHomeContent(isAdmin) {
  if (!isAdmin) {
    renderDoctorRows(dashboardDoctorGrid, state.doctors.slice(0, 4));
    return;
  }

  const pending = state.allPractitioners.filter((item) => item.status === "pending").slice(0, 4);
  dashboardDoctorGrid.innerHTML = pending.length
    ? pending.map((doctor) => `
      <article class="activity-row">
        <strong>${doctorName(doctor)} ${statusBadge(doctor.status)}</strong>
        <p>${doctor.regulator} · ${doctor.registrationNumber} · ${doctor.specialization}</p>
      </article>
    `).join("")
    : '<div class="empty-state">No pending practitioner reviews.</div>';

  dashboardNotifications.innerHTML = `
    <article class="activity-row">
      <strong>Operational focus</strong>
      <p>Use Admin review for credential decisions, Analytics for status counts, Monitoring for service checks, and Users for account visibility.</p>
    </article>
  `;
}

function renderPractitionerApplication() {
  const application = state.practitionerApplication;
  const status = application?.status;
  const currentStatus = document.querySelector("#practitionerStatus");
  currentStatus.className = `status-pill status-${status || "pending"}`;
  currentStatus.textContent = application ? statusLabel(status) : "Not applied";

  if (!application) {
    practitionerForm.classList.remove("hidden");
    return;
  }

  practitionerForm.classList.toggle("hidden", status === "pending" || status === "verified");
  Object.entries(application).forEach(([key, value]) => {
    const field = practitionerForm.elements[key];
    if (!field || value == null) return;
    field.value = Array.isArray(value) ? value.join(" - ") : value;
  });
}

function renderAdminReviews() {
  if (!state.user?.isAdmin) return;

  const practitioners = state.adminReviewFilter === "all"
    ? state.allPractitioners
    : state.allPractitioners.filter((doctor) => doctor.status === state.adminReviewFilter);

  if (!practitioners.length) {
    adminReviewList.innerHTML = '<div class="empty-state">No practitioner applications yet.</div>';
    return;
  }

  adminReviewList.innerHTML = practitioners
    .map((doctor) => `
      <article class="review-card">
        <div>
          <div class="review-card-header">
            <h3>${doctorName(doctor)}</h3>
            ${statusBadge(doctor.status)}
          </div>
          <p>${doctor.practitionerCadre || "Practitioner"} · ${doctor.specialization || "General practice"}</p>
          <p>${doctor.regulator || "Regulator"} registration: <strong>${doctor.registrationNumber || "Not provided"}</strong></p>
          <p>${doctor.address || "No clinic address provided"}</p>
          ${doctor.verificationNotes ? `<p class="review-note"><strong>Review reason:</strong> ${doctor.verificationNotes}</p>` : ""}
        </div>
        <div class="review-actions">
          <button class="review-button primary" type="button" data-review="${doctor._id}" data-status="verified">Verify</button>
          <button class="review-button secondary" type="button" data-review="${doctor._id}" data-status="expired">Expire</button>
          <button class="review-button danger" type="button" data-review="${doctor._id}" data-status="rejected">Reject</button>
        </div>
      </article>
    `)
    .join("");
}

function renderAdminAnalytics() {
  if (!state.user?.isAdmin) return;
  const counts = ["pending", "verified", "rejected", "expired"].map((status) => ({
    status,
    count: state.allPractitioners.filter((item) => item.status === status).length,
  }));
  const today = new Date();
  const loginsToday = state.users.filter((user) => sameDay(user.lastLoginAt, today)).length;
  const newUsers = countByDay(state.users, "createdAt");
  const logins = countByDay(state.users, "lastLoginAt");
  const maxValue = Math.max(1, ...newUsers.map((item) => item.count), ...logins.map((item) => item.count));
  const usersPoints = linePoints(newUsers, maxValue);
  const loginPoints = linePoints(logins, maxValue);
  const yTicks = [maxValue, Math.round(maxValue / 2), 0];
  const chartWidth = 700;
  const chartHeight = 260;
  const padding = { top: 28, right: 24, bottom: 52, left: 58 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const yFor = (value) => chartHeight - padding.bottom - (value / maxValue) * plotHeight;
  const xFor = (index) => padding.left + (plotWidth / Math.max(1, newUsers.length - 1)) * index;

  adminUserCount.textContent = String(state.users.length);
  adminPendingCount.textContent = String(loginsToday);
  adminVerifiedCount.textContent = String(counts.find((item) => item.status === "verified")?.count || 0);
  adminUsageChart.innerHTML = `
    <div class="chart-legend">
      <span><i class="legend-dot users"></i>New users</span>
      <span><i class="legend-dot logins"></i>Users logged in</span>
    </div>
    <div class="line-chart">
      <svg viewBox="0 0 ${chartWidth} ${chartHeight}" role="img" aria-label="Seven day usage trend">
        ${yTicks.map((tick) => `
          <line class="chart-grid-line" x1="${padding.left}" y1="${yFor(tick)}" x2="${chartWidth - padding.right}" y2="${yFor(tick)}"></line>
          <text class="chart-y-label" x="${padding.left - 12}" y="${yFor(tick) + 4}">${tick}</text>
        `).join("")}
        <line class="chart-axis" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${chartHeight - padding.bottom}"></line>
        <line class="chart-axis" x1="${padding.left}" y1="${chartHeight - padding.bottom}" x2="${chartWidth - padding.right}" y2="${chartHeight - padding.bottom}"></line>
        <text class="chart-axis-title y" x="18" y="${padding.top + plotHeight / 2}">Users</text>
        <text class="chart-axis-title x" x="${padding.left + plotWidth / 2}" y="${chartHeight - 10}">Last 7 days</text>
        <polyline class="line-series users" points="${usersPoints}"></polyline>
        <polyline class="line-series logins" points="${loginPoints}"></polyline>
        ${newUsers.map((item, index) => {
          const actualX = xFor(index);
          const actualY = yFor(item.count);
          const loginY = yFor(logins[index].count);
          return `
            <circle class="line-point users" cx="${actualX.toFixed(1)}" cy="${actualY.toFixed(1)}" r="4"></circle>
            <circle class="line-point logins" cx="${actualX.toFixed(1)}" cy="${loginY.toFixed(1)}" r="4"></circle>
            <text class="chart-label" x="${actualX.toFixed(1)}" y="${chartHeight - 32}">${item.label}</text>
          `;
        }).join("")}
      </svg>
    </div>
  `;
  adminAnalyticsList.innerHTML = counts.map((item) => `
    <article class="activity-row clickable-row" data-filter-status="${item.status}">
      <strong>${statusBadge(item.status)}</strong>
      <p>${item.count} practitioner ${item.count === 1 ? "application" : "applications"} · click to review details</p>
    </article>
  `).join("");
}

function renderAdminMonitoring() {
  if (!state.user?.isAdmin) return;
  const pending = state.allPractitioners.filter((item) => item.status === "pending");
  const stalePending = pending.filter((item) => {
    const createdAt = new Date(item.createdAt);
    return Date.now() - createdAt.getTime() > 3 * 24 * 60 * 60 * 1000;
  });
  const unverifiedUsers = state.users.filter((user) => !user.isVerified);
  const inactiveUsers = state.users.filter((user) => {
    if (!user.lastLoginAt) return true;
    return Date.now() - new Date(user.lastLoginAt).getTime() > 14 * 24 * 60 * 60 * 1000;
  });

  adminMonitoringList.innerHTML = `
    <article class="activity-row clickable-row" data-monitor-target="pending">
      <strong>${statusBadge(pending.length ? "pending" : "verified")} Practitioner review queue</strong>
      <p>${pending.length} pending applications. ${stalePending.length} have waited more than 3 days.</p>
    </article>
    <article class="activity-row">
      <strong>${statusBadge(unverifiedUsers.length ? "pending" : "verified")} Email verification follow-up</strong>
      <p>${unverifiedUsers.length} users have not completed OTP verification.</p>
    </article>
    <article class="activity-row">
      <strong>${statusBadge(inactiveUsers.length ? "expired" : "verified")} Dormant accounts</strong>
      <p>${inactiveUsers.length} users have no login activity in the last 14 days or have never logged in.</p>
    </article>
  `;
}

function renderAdminUsers() {
  if (!state.user?.isAdmin) return;
  if (!state.users.length) {
    adminUsersList.innerHTML = '<div class="empty-state">No user records loaded.</div>';
    return;
  }

  adminUsersList.innerHTML = state.users.map((user) => `
    <article class="review-card user-row" data-user-id="${user._id}">
      <span class="avatar">${initialsFromName(user.name)}</span>
      <div>
        <div class="review-card-header">
          <h3>${user.name || "Unnamed user"}</h3>
          ${user.isAdmin ? '<span class="status-pill status-verified">Admin</span>' : '<span class="status-pill status-pending">Patient</span>'}
          ${user.isVerified ? '<span class="status-pill status-verified">Email verified</span>' : '<span class="status-pill status-rejected">Unverified</span>'}
          ${user.isActive === false ? '<span class="status-pill status-rejected">Inactive</span>' : '<span class="status-pill status-verified">Active</span>'}
        </div>
        <p>${user.email || "No email"} · ${user.phoneNumber || "No phone"} · ${user.loginCount || 0} logins</p>
      </div>
    </article>
  `).join("");
}

function openUserDetails(userId) {
  const user = state.users.find((item) => item._id === userId);
  if (!user) return;

  state.selectedAdminUser = user;
  userModalAvatar.textContent = initialsFromName(user.name);
  userModalName.textContent = user.name || "Unnamed user";
  userModalEmail.textContent = user.email || "-";
  userModalPhone.textContent = user.phoneNumber || "-";
  userModalRole.innerHTML = user.isAdmin
    ? '<span class="status-pill status-verified">Admin</span>'
    : user.isDoctor
      ? '<span class="status-pill status-verified">Practitioner</span>'
      : '<span class="status-pill status-pending">Patient</span>';
  userModalVerified.innerHTML = user.isVerified
    ? '<span class="status-pill status-verified">Verified</span>'
    : '<span class="status-pill status-rejected">Unverified</span>';
  userModalActive.innerHTML = user.isActive === false
    ? '<span class="status-pill status-rejected">Inactive</span>'
    : '<span class="status-pill status-verified">Active</span>';
  userModalLastLogin.textContent = user.lastLoginAt
    ? new Date(user.lastLoginAt).toLocaleString("en-KE")
    : "Never";
  userModalLoginCount.textContent = String(user.loginCount || 0);
  toggleUserStatusButton.textContent = user.isActive === false ? "Reactivate user" : "Deactivate user";
  toggleUserStatusButton.classList.toggle("warn-button", user.isActive !== false);
  userModal.showModal();
}

async function enterApp(message = "Dashboard ready") {
  try {
    await loadUserProfile();
  } catch (error) {
    localStorage.removeItem("appointmentToken");
    state.token = "";
    toast("Session expired", "Please log in again.", "warn");
    return;
  }

  await loadDoctors();
  authView.classList.add("hidden");
  appView.classList.remove("hidden");
  switchDashboardTab("home");
  renderDashboard();
  toast(message);
}

function logout() {
  state.token = "";
  state.user = null;
  localStorage.removeItem("appointmentToken");
  appView.classList.add("hidden");
  authView.classList.remove("hidden");
  updateAccountMode("login");
  toast("Logged out", "You have been signed out.");
}

function updateAccountMode(mode) {
  state.accountMode = mode;
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode || (mode === "verify" && tab.dataset.mode === "register"));
  });
  document.querySelectorAll("[data-register-only]").forEach((field) => {
    field.classList.toggle("hidden", mode !== "register");
  });
  document.querySelectorAll("[data-otp-only]").forEach((field) => {
    field.classList.toggle("hidden", mode !== "verify");
  });
  accountForm.querySelector("input[name='email']").closest("label").classList.remove("hidden");
  accountForm.querySelector("input[name='password']").closest("label").classList.toggle("hidden", mode === "verify");
  resendOtpButton.classList.toggle("hidden", mode !== "verify");
  accountButton.textContent = mode === "login"
    ? "Login"
    : mode === "verify"
      ? "Verify email"
      : "Create account";
  setStatus(accountStatus, "");
}

function openBooking(doctorId) {
  state.selectedDoctor = state.doctors.find((doctor) => doctor._id === doctorId);
  bookingTitle.textContent = `Book ${doctorName(state.selectedDoctor)}`;
  setStatus(bookingStatus, "");
  bookingForm.reset();
  bookingModal.showModal();
}

doctorGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-book]");
  if (button) {
    openBooking(button.dataset.book);
  }
});

[dashboardDoctorGrid, dashboardAllDoctors].forEach((target) => {
  target.addEventListener("click", (event) => {
    const button = event.target.closest("[data-book]");
    if (button) {
      openBooking(button.dataset.book);
    }
  });
});

doctorSearch.addEventListener("input", renderDoctors);
refreshButton.addEventListener("click", loadDoctors);
dashboardRefreshButton.addEventListener("click", async () => {
  await loadDoctors();
  toast("Dashboard refreshed");
});
logoutButton.addEventListener("click", logout);
closeBooking.addEventListener("click", () => bookingModal.close());
passwordToggle.addEventListener("click", () => {
  const shouldShow = passwordInput.type === "password";
  passwordInput.type = shouldShow ? "text" : "password";
  passwordToggle.setAttribute("aria-pressed", String(shouldShow));
  passwordToggle.setAttribute("aria-label", shouldShow ? "Hide password" : "Show password");
});

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => updateAccountMode(tab.dataset.mode));
});

document.querySelectorAll("[data-dashboard-tab]").forEach((button) => {
  button.addEventListener("click", () => {
    switchDashboardTab(button.dataset.dashboardTab);
  });
});

function switchDashboardTab(tab) {
  const button = document.querySelector(`[data-dashboard-tab="${tab}"]`);
  if (!button || button.classList.contains("hidden")) return;

  document.querySelectorAll("[data-dashboard-tab]").forEach((item) => {
    item.classList.toggle("active", item === button);
  });
  document.querySelectorAll("[data-dashboard-panel]").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.dashboardPanel !== tab);
  });
}

practitionerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = Object.fromEntries(new FormData(practitionerForm));
  formData.consultationFees = Number(formData.consultationFees);
  formData.timings = String(formData.timings)
    .split("-")
    .map((item) => item.trim())
    .filter(Boolean);

  try {
    toast("Submitting application", "Your details will be reviewed manually.");
    const data = await api("/api/user/apply-doctor-account", {
      method: "POST",
      body: JSON.stringify(formData),
    });
    await loadUserProfile();
    renderDashboard();
    toast("Application received", data.message || "Your verification is pending.");
  } catch (error) {
    toast("Application failed", error.message, "warn");
  }
});

adminReviewList.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-review]");
  if (!button) return;
  const status = button.dataset.status;
  const verificationNotes = status === "verified"
    ? "Credentials manually verified against the selected regulator."
    : window.prompt(`Reason for marking this application as ${status}:`)?.trim();

  if (status !== "verified" && !verificationNotes) {
    toast("Reason required", "Add a clear review reason before changing this status.", "warn");
    return;
  }

  try {
    const data = await api("/api/admin/change-doctor-account-status", {
      method: "POST",
      body: JSON.stringify({
        doctorId: button.dataset.review,
        status,
        verificationNotes,
      }),
    });
    await loadUserProfile();
    renderDashboard();
    toast("Status updated", data.message || "Practitioner status changed.");
  } catch (error) {
    toast("Update failed", error.message, "warn");
  }
});

adminAnalyticsList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-filter-status]");
  if (!row) return;
  state.adminReviewFilter = row.dataset.filterStatus;
  renderAdminReviews();
  switchDashboardTab("admin");
  toast("Review list filtered", `Showing ${statusLabel(state.adminReviewFilter).toLowerCase()} applications.`);
});

adminMonitoringList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-monitor-target='pending']");
  if (!row) return;
  state.adminReviewFilter = "pending";
  renderAdminReviews();
  switchDashboardTab("admin");
});

adminUsersList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-user-id]");
  if (row) {
    openUserDetails(row.dataset.userId);
  }
});

closeUserModal.addEventListener("click", () => userModal.close());

toggleUserStatusButton.addEventListener("click", async () => {
  if (!state.selectedAdminUser) return;
  const nextActiveState = state.selectedAdminUser.isActive === false;

  try {
    const data = await api("/api/admin/update-user-status", {
      method: "POST",
      body: JSON.stringify({
        targetUserId: state.selectedAdminUser._id,
        isActive: nextActiveState,
      }),
    });
    state.users = state.users.map((user) => user._id === data.data._id ? data.data : user);
    state.selectedAdminUser = data.data;
    renderDashboard();
    openUserDetails(data.data._id);
    toast("User updated", data.message);
  } catch (error) {
    toast("Update failed", error.message, "warn");
  }
});

accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(accountStatus, "");
  toast("Sending request", "One moment while we process this.");
  const formData = Object.fromEntries(new FormData(accountForm));
  const endpoint = state.accountMode === "login"
    ? "/api/user/login"
    : state.accountMode === "verify"
      ? "/api/user/verify-email-otp"
      : "/api/user/register";

  if (state.accountMode === "verify") {
    formData.email = state.pendingVerificationEmail || formData.email;
  }

  try {
    const data = await api(endpoint, {
      method: "POST",
      body: JSON.stringify(formData),
    });
    if (data.data?.needsVerification) {
      state.pendingVerificationEmail = data.data.email;
      localStorage.setItem("pendingVerificationEmail", state.pendingVerificationEmail);
      updateAccountMode("verify");
      toast("Check your email", data.message || "Enter the code sent to your email.");
      return;
    }
    if (data.data) {
      state.token = data.data;
      localStorage.setItem("appointmentToken", state.token);
      localStorage.removeItem("pendingVerificationEmail");
      state.pendingVerificationEmail = "";
      await enterApp(data.message || "Welcome to CareSlot");
      return;
    }
    toast("Done", data.message || "Request completed.");
  } catch (error) {
    if (error.data?.needsVerification) {
      state.pendingVerificationEmail = error.data.email;
      localStorage.setItem("pendingVerificationEmail", state.pendingVerificationEmail);
      accountForm.email.value = state.pendingVerificationEmail;
      updateAccountMode("verify");
    }
    toast("Action needed", error.message, "warn");
  }
});

resendOtpButton.addEventListener("click", async () => {
  const email = state.pendingVerificationEmail || accountForm.email.value.trim();
  if (!email) {
    toast("Email required", "Enter your email first.", "warn");
    return;
  }

  try {
    toast("Resending code", "Check your inbox in a moment.");
    const data = await api("/api/user/resend-email-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    state.pendingVerificationEmail = email;
    localStorage.setItem("pendingVerificationEmail", email);
    toast("Code resent", data.message || "Check your email.");
  } catch (error) {
    toast("Could not resend", error.message, "warn");
  }
});

bookingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selectedDoctor) return;

  if (!state.token) {
    setStatus(bookingStatus, "Login before sending appointment requests.", "warn");
    toast("Login required", "Please log in before booking.", "warn");
    return;
  }

  const formData = Object.fromEntries(new FormData(bookingForm));
  const date = new Date(formData.date);
  const payload = {
    doctorId: state.selectedDoctor._id,
    doctorInfo: state.selectedDoctor,
    userInfo: {
      name: state.user?.name || "Patient",
      email: state.user?.email,
      phoneNumber: state.user?.phoneNumber,
    },
    date: `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`,
    time: formData.time,
    reason: formData.reason,
  };

  try {
    setStatus(bookingStatus, "Checking availability...");
    await api("/api/user/check-booking-availability", {
      method: "POST",
      body: JSON.stringify({ doctorId: payload.doctorId, date: payload.date, time: payload.time }),
    });
    setStatus(bookingStatus, "Sending request...");
    await api("/api/user/book-appointment", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    state.appointments.unshift({
      doctorName: doctorName(state.selectedDoctor),
      date: payload.date,
      time: payload.time,
      reason: payload.reason,
      status: "pending",
    });
    localStorage.setItem("appointmentDrafts", JSON.stringify(state.appointments));
    renderDashboard();
    setStatus(bookingStatus, "Appointment request sent.", "success");
    toast("Appointment requested", `${doctorName(state.selectedDoctor)} will review your request.`);
    window.setTimeout(() => bookingModal.close(), 650);
  } catch (error) {
    setStatus(bookingStatus, error.message, "warn");
    toast("Booking failed", error.message, "warn");
  }
});

updateAccountMode(state.pendingVerificationEmail ? "verify" : "login");
if (state.token) {
  enterApp("Session restored");
} else {
  loadDoctors();
}
