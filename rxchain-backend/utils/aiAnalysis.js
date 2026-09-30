function normalizeMedicineName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function analyzePrescription({
  diagnosis = "",
  newMedicines = [],
  previousMedicines = [],
  previousDiagnoses = [],
}) {
  const warnings = [];

  const previousNames = previousMedicines.map(normalizeMedicineName);

  for (const medicine of newMedicines) {
    const newName = normalizeMedicineName(medicine.name);

    if (!newName) continue;

    // Check whether the same medicine was already prescribed
    // in the patient's previous records.
    if (previousNames.includes(newName)) {
      warnings.push({
        severity: "medium",
        medicines: [medicine.name],
        reason:
          "This medicine appears in the patient's previous prescription history. Review the previous prescription before continuing.",
      });
    }

    // Basic same-name overlap check.
    // This is intentionally conservative and is NOT a clinical diagnosis.
    const medicineWords = newName.split(" ");

    for (const previous of previousNames) {
      if (
        previous !== newName &&
        medicineWords.length > 0 &&
        previous.includes(medicineWords[0])
      ) {
        warnings.push({
          severity: "low",
          medicines: [medicine.name, previous],
          reason:
            "The current medicine may overlap with a medicine found in the patient's previous records. Review both records before finalizing.",
        });
      }
    }
  }

  let summary = "No medicine overlap was detected from the available previous records.";

  if (warnings.length > 0) {
    summary =
      "The analysis found items that should be reviewed against the patient's previous prescription history.";
  }

  return {
    warnings,
    summary,
    context: {
      diagnosis,
      previousDiagnoses,
      medicinesReviewed: newMedicines.map((m) => m.name),
      previousMedicinesReviewed: previousMedicines,
    },
  };
}

module.exports = {
  analyzePrescription,
};