/* ==========================================================================
   prescription-view.js — logic for view-prescription.html
   Depends on blockchain.js being loaded first.
   ========================================================================== */

(function () {
  const session = RxChain.requireRole("patient", "../../login.html");
  document.getElementById("sbUserName").textContent = session.userId;

  document.getElementById("signOutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    RxChain.signOut("../../login.html");
  });

  const id = new URLSearchParams(window.location.search).get("id");
  const rx = id ? RxChain.getById(id) : null;

  if (!rx) {
    document.getElementById("notFound").style.display = "block";
    return;
  }

  document.getElementById("rxSub").textContent = `${rx.id} — ${rx.medication}`;
  document.getElementById("panelWrap").style.display = "block";

  const badge = document.getElementById("statusBadge");
  badge.textContent = rx.status;
  badge.className = "badge " + RxChain.badgeClass(rx.status);

  document.getElementById("dMed").textContent = rx.medication;
  document.getElementById("dDosage").textContent = rx.dosage;
  document.getElementById("dFreq").textContent = rx.frequency;
  document.getElementById("dDur").textContent = rx.duration;
  document.getElementById("dDoctor").textContent = rx.doctorName;
  document.getElementById("dDate").textContent = RxChain.formatDate(rx.createdAt);
  document.getElementById("dNotes").textContent = rx.notes || "No additional notes.";
  document.getElementById("dHash").textContent = "hash: " + rx.hash;

  document.getElementById("qrLink").href = `qr-code.html?id=${rx.id}`;

  if (rx.aiReport) {
    const aiLink = document.getElementById("aiLink");
    aiLink.style.display = "inline-flex";
    aiLink.href = `view-ai-report.html?id=${rx.id}`;
  }
})();
