const memberID = sessionStorage.getItem("memberID");
if (!memberID) window.location.replace("https://kbk-ops.github.io/kbkai/");

const API_URL =
  "https://script.google.com/macros/s/AKfycbzDE01iHOXt_0RQ9uUSPnc1uv833pH9wjwqIjkyQSBgw4U-0_vLUWErQi2iP-QH_2A4/exec";

let allContributions = [];
let currentUser = null;

/* ---------------- LOADER ---------------- */
function showLoader() {
  document.getElementById("loader").style.display = "flex";
}
function hideLoader() {
  document.getElementById("loader").style.display = "none";
}

/* ---------------- PROFILE IMAGE ---------------- */
function formatImage(link) {
  if (!link) return "";
  const match =
    link.match(/\/d\/([a-zA-Z0-9_-]+)/) ||
    link.match(/id=([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s200`;
  }
  return link;
}

/* ---------------- TAB ---------------- */
function showTab(id) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

/* ---------------- LOAD PROFILE ONLY ---------------- */
function loadProfile(members) {
  currentUser = members.find(
    (r) => String(r.id).trim() === String(memberID).trim()
  );

  const hour = new Date().getHours();
  const greet =
    hour < 12
      ? "Good Morning"
      : hour < 18
      ? "Good Afternoon"
      : "Good Evening";

  document.getElementById("greet").textContent =
    `${greet}, ${currentUser?.firstName || "Member"}!`;

  document.getElementById("profilePic").src =
    formatImage(currentUser?.profilePic);
}

/* ---------------- BUILD YEAR FILTER ---------------- */
function buildYearFilter() {
  const yearSelect = document.getElementById("yearFilter");

  const memberContri = allContributions.filter(
    (r) => String(r.memberID).trim() === String(memberID).trim()
  );

  const years = [...new Set(
    memberContri.map(r => String(r.year).trim())
  )].sort((a, b) => b - a);

  yearSelect.innerHTML = "<option value='all'>All</option>";

  years.forEach(y => {
    yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
  });
}

/* ---------------- RENDER CONTRIBUTIONS ONLY ---------------- */
function renderContributions() {
  const yearSelect = document.getElementById("yearFilter");
  const tableBody = document.getElementById("contriBody");
  const totalField = document.getElementById("totalAmt");
  const tableHead = document.querySelector("#contributionTab thead");
  const tableFoot = document.querySelector("#contributionTab tfoot");

  const memberContri = allContributions.filter(
    (r) => String(r.memberID).trim() === String(memberID).trim()
  );

  // NO CONTRIBUTIONS AT ALL
  if (memberContri.length === 0) {

    yearSelect.style.display = "none";
    tableHead.style.display = "none";
    tableFoot.style.display = "none";

    tableBody.innerHTML = `
      <tr>
        <td colspan="4" style="padding:25px; text-align:justify;">
          <strong>Hello ${currentUser?.firstName || "Member"},</strong><br><br>
          Our records show that you are not yet paying our monthly organization dues.
          To remain a member in good standing and continue enjoying all member benefits,
          please coordinate with your Barangay Officers as soon as possible.<br><br>
          Thank you for your prompt attention.
        </td>
      </tr>
    `;

    totalField.textContent = "";
    return;
  }

  // ✅ IF HAS CONTRIBUTIONS — SHOW EVERYTHING
  yearSelect.style.display = "block";
  tableHead.style.display = "";
  tableFoot.style.display = "";

  const selectedYear = yearSelect.value || "all";

  let total = 0;
  let html = "";

  const filtered = memberContri.filter(r =>
    selectedYear === "all" ||
    String(r.year).trim() === String(selectedYear).trim()
  );

  filtered.forEach(r => {
    const dateObj = new Date(r.posted);
    const formattedDate =
      ("0" + (dateObj.getMonth() + 1)).slice(-2) +
      "/" +
      ("0" + dateObj.getDate()).slice(-2) +
      "/" +
      dateObj.getFullYear();

    total += Number(r.amount);

    html += `
      <tr>
        <td>${r.month}</td>
        <td>${Number(r.amount).toLocaleString()}</td>
        <td>${formattedDate}</td>
        <td>${r.receiveBy || ""}</td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
  totalField.textContent = total.toLocaleString();
}

/* ---------------- INITIAL DASHBOARD ---------------- */
function loadDashboard() {
  showLoader();

  Promise.all([
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "members" })
    }).then((r) => r.json()),
    fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({ action: "contributions" })
    }).then((r) => r.json())
  ])
    .then(([members, contributions]) => {

      allContributions = contributions;

      loadProfile(members);
      buildYearFilter();
      renderContributions();
    })
    .finally(() => hideLoader());
}

/* ---------------- FILTER CHANGE ---------------- */
document
  .getElementById("yearFilter")
  .addEventListener("change", renderContributions);

/* ---------------- START ---------------- */
loadDashboard();
initDashboardTabs();
