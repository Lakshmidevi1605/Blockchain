/* patient-picker.js - fills the patient dropdown and registers new patients.
   Loaded before prescription.js on create-prescription.html */
(function () {
  const sel = document.getElementById("patientId");
  const nameBox = document.getElementById("patientName");
  const msg = document.getElementById("npMsg");

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function sync() {
    const opt = sel.options[sel.selectedIndex];
    nameBox.value = opt && opt.dataset.name ? opt.dataset.name : "";
  }

  function load(selectId) {
    let patients = [];
    try {
      patients = RxChain.getPatients();
    } catch (err) {
      sel.innerHTML = '<option value="">Could not load patients</option>';
      msg.textContent = err.message;
      return;
    }
    sel.innerHTML = '<option value="">' + (patients.length ? "Select patient\u2026" : "No patients yet - register one above") + "</option>" +
      patients.map((p) => '<option value="' + esc(p.registrationId) + '" data-name="' + esc(p.name) + '">' +
        esc(p.registrationId) + " \u2014 " + esc(p.name) + "</option>").join("");
    if (selectId) sel.value = selectId;
    sync();
  }

  sel.addEventListener("change", sync);

  document.getElementById("npBtn").addEventListener("click", () => {
    const name = document.getElementById("npName").value.trim();
    const password = document.getElementById("npPass").value;
    const dateOfBirth = document.getElementById("npDob").value;
    if (!name || password.length < 6) {
      msg.textContent = "Enter the patient's name and a password of at least 6 characters.";
      return;
    }
    try {
      const u = RxChain.createUser({ name, password, dateOfBirth });
      msg.innerHTML = 'Patient created. <b style="font-size:1.15em;">Patient ID: ' + esc(u.registrationId) +
        '</b> &nbsp; Password: <b>' + esc(password) + '</b><br>Give both to the patient for login. You can find this ID any time under <a href="patient-records.html">Patient records</a>.';
      document.getElementById("npName").value = "";
      document.getElementById("npPass").value = "";
      document.getElementById("npDob").value = "";
      load(u.registrationId);
    } catch (err) {
      msg.textContent = err.message;
    }
  });

  load(new URLSearchParams(window.location.search).get("patient") || "");
})();
