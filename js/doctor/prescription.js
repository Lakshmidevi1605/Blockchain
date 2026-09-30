/* ==========================================================================
   prescription.js — logic for create-prescription.html
   Depends on blockchain.js being loaded first.
   ========================================================================== */

(function () {
  const session = RxChain.requireRole("doctor", "../../login.html");
  document.getElementById("sbUserName").textContent = session.userId;

  document.getElementById("signOutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    RxChain.signOut("../../login.html");
  });

  const form = document.getElementById("rxForm");
  const status = document.getElementById("formStatus");

  function showStatus(message, type) {
    status.textContent = message;
    status.style.display = "block";
    status.className = "form-status show status-" + type;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const data = {
      patientId: document.getElementById("patientId").value.trim(),
      patientName: document.getElementById("patientName").value.trim(),
      medication: document.getElementById("medication").value.trim(),
      dosage: document.getElementById("dosage").value.trim(),
      frequency: document.getElementById("frequency").value.trim(),
      duration: document.getElementById("duration").value.trim(),
      notes: document.getElementById("notes").value.trim(),
      doctorId: session.userId,
      doctorName: session.name,
    };

    if (!data.patientId || !data.medication || !data.dosage || !data.duration) {
      showStatus("Please fill in the required fields before submitting.", "error");
      return;
    }

    let block;
    try {
      block = RxChain.addPrescription(data);
    } catch (err) {
      showStatus(err.message, "error");
      return;
    }
    showStatus(`Block ${block.id} written to chain (hash ${block.hash.slice(0, 18)}…). Redirecting…`, "success");

    setTimeout(() => {
      window.location.href = `qr-generation.html?id=${block.id}`;
    }, 700);
  });
})();
