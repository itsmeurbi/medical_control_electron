import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Normalize date values for comparison (ignore format differences)
// Handles both "2004-05-12 02:00:00 UTC" and "2004-05-12T02:00:00.000Z"
function normalizeDate(dateStr) {
  if (!dateStr || dateStr === '') return '';
  try {
    let normalized = String(dateStr).trim();
    // If it doesn't already have 'T', replace space between date and time with 'T'
    // This handles "2004-05-12 02:00:00 UTC" format
    if (!normalized.includes('T') && normalized.match(/^\d{4}-\d{2}-\d{2}\s+/)) {
      normalized = normalized.replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T');
    }
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return '';
    // Return just the date part (YYYY-MM-DD)
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
}

// Normalize string values
function normalize(str) {
  if (!str) return '';
  return String(str).trim().toLowerCase();
}

// Titleize names (capitalize first letter of each word) - same as import
function titleizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Normalize numeric values (75.0 === 75)
function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (isNaN(num)) return value; // Return original if not a number
  // Return the number as-is (JavaScript will handle 75.0 === 75)
  return num;
}

// Compare two patient records (ignoring id, created_at, updated_at, medical_record)
function comparePatients(source, export_, sourceId, exportId) {
  const fieldsToIgnore = ['id', 'created_at', 'updated_at', 'medical_record'];
  const numericFields = ['weight', 'height', 'evaluation', 'heart_rate', 'breath_rate'];
  const differences = [];

  const allKeys = new Set([...Object.keys(source), ...Object.keys(export_)]);

  for (const key of allKeys) {
    if (fieldsToIgnore.includes(key)) continue;

    // Special handling for dates
    if (key.includes('date') || key.includes('_at')) {
      const sourceDate = normalizeDate(source[key]);
      const exportDate = normalizeDate(export_[key]);
      if (sourceDate !== exportDate) {
        differences.push({
          field: key,
          source: source[key],
          export: export_[key]
        });
      }
    }
    // Special handling for numeric fields
    else if (numericFields.includes(key)) {
      const sourceNum = normalizeNumber(source[key]);
      const exportNum = normalizeNumber(export_[key]);
      if (sourceNum !== exportNum) {
        differences.push({
          field: key,
          source: source[key],
          export: export_[key]
        });
      }
    }
    // String comparison for other fields
    else {
      const sourceVal = normalize(source[key] || '');
      const exportVal = normalize(export_[key] || '');
      if (sourceVal !== exportVal) {
        differences.push({
          field: key,
          source: source[key],
          export: export_[key]
        });
      }
    }
  }

  return differences;
}

// Main comparison
async function compare() {
  console.log('Reading source patients...');
  const sourcePatientsData = fs.readFileSync('/Users/staff/Downloads/patients_and_consults_2026-01-28/patients_2026-01-28.csv', 'utf8');
  const sourcePatients = parse(sourcePatientsData, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log('Reading export patients...');
  const exportPatientsData = fs.readFileSync('/Users/staff/Downloads/392a2932-d20c-4ca7-99ed-90db3bb2021a/patients_2026-01-28.csv', 'utf8');
  const exportPatients = parse(exportPatientsData, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`\nSource patients: ${sourcePatients.length}`);
  console.log(`Export patients: ${exportPatients.length}`);
  console.log(`Difference: ${sourcePatients.length - exportPatients.length} patients\n`);

  // Create lookup maps - use arrays to handle potential duplicates
  const sourceMap = new Map();
  const exportMap = new Map();

  sourcePatients.forEach(p => {
    // Normalize name the same way as import (titleize, then lowercase for comparison)
    // Match by name + birth_date only (medical_record gets reassigned during import)
    const normalizedName = normalize(titleizeName(p.name || ''));
    const normalizedBirthDate = normalizeDate(p.birth_date) || '';
    const key = `${normalizedName}|${normalizedBirthDate}`;

    // Store as array to handle duplicates
    if (!sourceMap.has(key)) {
      sourceMap.set(key, []);
    }
    sourceMap.get(key).push(p);
  });

  exportPatients.forEach(p => {
    // Export names are already titleized, just normalize for comparison
    // Match by name + birth_date only (medical_record gets reassigned during import)
    const normalizedName = normalize(p.name || '');
    const normalizedBirthDate = normalizeDate(p.birth_date) || '';
    const key = `${normalizedName}|${normalizedBirthDate}`;

    // Store as array to handle duplicates
    if (!exportMap.has(key)) {
      exportMap.set(key, []);
    }
    exportMap.get(key).push(p);
  });

  // Find missing patients
  const missingInExport = [];
  for (const [key, sourcePatientsList] of sourceMap) {
    if (!exportMap.has(key)) {
      // All patients with this key are missing
      missingInExport.push(...sourcePatientsList);
    } else {
      // Check if we have enough matches
      const exportPatientsList = exportMap.get(key);
      if (sourcePatientsList.length > exportPatientsList.length) {
        // Some patients are missing
        const missingCount = sourcePatientsList.length - exportPatientsList.length;
        missingInExport.push(...sourcePatientsList.slice(0, missingCount));
      }
    }
  }

  // Find extra patients
  const extraInExport = [];
  for (const [key, exportPatientsList] of exportMap) {
    if (!sourceMap.has(key)) {
      // All patients with this key are extra
      extraInExport.push(...exportPatientsList);
    } else {
      // Check if we have too many
      const sourcePatientsList = sourceMap.get(key);
      if (exportPatientsList.length > sourcePatientsList.length) {
        // Some patients are extra
        const extraCount = exportPatientsList.length - sourcePatientsList.length;
        extraInExport.push(...exportPatientsList.slice(0, extraCount));
      }
    }
  }

  console.log(`Missing in export: ${missingInExport.length}`);
  if (missingInExport.length > 0) {
    missingInExport.slice(0, 10).forEach(p => {
      console.log(`  - ${p.name} (${p.medical_record})`);
    });
  }

  console.log(`\nExtra in export: ${extraInExport.length}`);
  if (extraInExport.length > 0) {
    extraInExport.slice(0, 10).forEach(p => {
      console.log(`  - ${p.name} (${p.medical_record})`);
    });
  }

  // Compare matching patients
  console.log('\nComparing matching patients...');
  const differences = [];
  let compared = 0;

  for (const [key, sourcePatientsList] of sourceMap) {
    const exportPatientsList = exportMap.get(key);
    if (exportPatientsList) {
      // Compare each source patient with corresponding export patient
      const minLength = Math.min(sourcePatientsList.length, exportPatientsList.length);
      for (let i = 0; i < minLength; i++) {
        const sourcePatient = sourcePatientsList[i];
        const exportPatient = exportPatientsList[i];
        const diff = comparePatients(sourcePatient, exportPatient, sourcePatient.id, exportPatient.id);
        if (diff.length > 0) {
          differences.push({
            patient: `${sourcePatient.name} (${sourcePatient.medical_record})`,
            differences: diff
          });
        }
        compared++;
      }
    }
  }

  console.log(`Compared ${compared} matching patients`);
  console.log(`Found ${differences.length} patients with differences\n`);

  if (differences.length > 0) {
    console.log('First 10 patients with differences:');
    differences.slice(0, 10).forEach(({ patient, differences: diffs }) => {
      console.log(`\n${patient}:`);
      diffs.slice(0, 5).forEach(d => {
        console.log(`  ${d.field}:`);
        console.log(`    Source: ${d.source}`);
        console.log(`    Export: ${d.export}`);
      });
    });
  }

  // Compare consultations
  console.log('\n\n=== CONSULTATIONS ===\n');
  const sourceConsultsData = fs.readFileSync('/Users/staff/Downloads/patients_and_consults_2026-01-28/consults_2026-01-28.csv', 'utf8');
  const sourceConsults = parse(sourceConsultsData, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  const exportConsultsData = fs.readFileSync('/Users/staff/Downloads/392a2932-d20c-4ca7-99ed-90db3bb2021a/consults_2026-01-28.csv', 'utf8');
  const exportConsults = parse(exportConsultsData, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true
  });

  console.log(`Source consultations: ${sourceConsults.length}`);
  console.log(`Export consultations: ${exportConsults.length}`);

  // Create patient ID mapping (source -> export) and reverse mapping (export -> source)
  const patientIdMap = new Map(); // source -> export
  const reversePatientIdMap = new Map(); // export -> source
  for (const [key, sourcePatientsList] of sourceMap) {
    const exportPatientsList = exportMap.get(key);
    if (exportPatientsList) {
      // Map each source patient to corresponding export patient
      const minLength = Math.min(sourcePatientsList.length, exportPatientsList.length);
      for (let i = 0; i < minLength; i++) {
        const sourcePatient = sourcePatientsList[i];
        const exportPatient = exportPatientsList[i];
        if (sourcePatient.id && exportPatient.id) {
          patientIdMap.set(sourcePatient.id, exportPatient.id);
          reversePatientIdMap.set(exportPatient.id, sourcePatient.id);
        }
      }
    }
  }

  console.log(`Mapped ${patientIdMap.size} patient IDs`);

  // Group consultations by patient + procedure + meds + date
  const sourceConsultMap = new Map();
  sourceConsults.forEach(c => {
    const key = `${c.patient_id}|${normalize(c.procedure)}|${normalize(c.meds)}|${normalizeDate(c.date)}`;
    if (!sourceConsultMap.has(key)) {
      sourceConsultMap.set(key, []);
    }
    sourceConsultMap.get(key).push(c);
  });

  const exportConsultMap = new Map();
  exportConsults.forEach(c => {
    // Map export patient_id back to source patient_id
    const sourcePatientId = reversePatientIdMap.get(c.patient_id);
    if (!sourcePatientId) {
      // Patient not found in mapping - might be from one of the missing patients
      return; // Skip consultations for unmapped patients
    }
    const key = `${sourcePatientId}|${normalize(c.procedure)}|${normalize(c.meds)}|${normalizeDate(c.date)}`;
    if (!exportConsultMap.has(key)) {
      exportConsultMap.set(key, []);
    }
    exportConsultMap.get(key).push(c);
  });

  // Count consultations for unmapped patients
  let unmappedConsults = 0;
  exportConsults.forEach(c => {
    if (!reversePatientIdMap.has(c.patient_id)) {
      unmappedConsults++;
    }
  });

  // Compare consultations in detail
  const missingConsults = [];
  const consultDifferences = [];
  let comparedConsults = 0;

  for (const [key, sourceConsultsList] of sourceConsultMap) {
    const exportConsultsList = exportConsultMap.get(key);
    if (!exportConsultsList || exportConsultsList.length < sourceConsultsList.length) {
      missingConsults.push({ key, sourceCount: sourceConsultsList.length, exportCount: exportConsultsList?.length || 0 });
    } else {
      // Compare each consultation in detail
      const minLength = Math.min(sourceConsultsList.length, exportConsultsList.length);
      for (let i = 0; i < minLength; i++) {
        const sourceConsult = sourceConsultsList[i];
        const exportConsult = exportConsultsList[i];

        // Compare fields (ignoring id, created_at, updated_at, patient_id since we already matched by mapped patient_id)
        const fieldsToCompare = ['procedure', 'meds', 'date'];
        const diff = [];

        for (const field of fieldsToCompare) {
          const sourceVal = normalize(sourceConsult[field] || '');
          const exportVal = normalize(exportConsult[field] || '');

          if (field === 'date') {
            const sourceDate = normalizeDate(sourceConsult[field]);
            const exportDate = normalizeDate(exportConsult[field]);
            if (sourceDate !== exportDate) {
              diff.push({ field, source: sourceConsult[field], export: exportConsult[field] });
            }
          } else if (sourceVal !== exportVal) {
            diff.push({ field, source: sourceConsult[field], export: exportConsult[field] });
          }
        }

        if (diff.length > 0) {
          consultDifferences.push({
            key,
            patientId: sourceConsult.patient_id,
            differences: diff
          });
        }
        comparedConsults++;
      }
    }
  }

  console.log(`\nConsultations for unmapped patients: ${unmappedConsults}`);
  console.log(`Compared ${comparedConsults} matching consultations`);
  console.log(`Missing consultations: ${missingConsults.length}`);
  if (missingConsults.length > 0 && missingConsults.length <= 20) {
    missingConsults.forEach(({ key, sourceCount, exportCount }) => {
      console.log(`  - ${key} (source: ${sourceCount}, export: ${exportCount})`);
    });
  } else if (missingConsults.length > 20) {
    console.log(`  (showing first 10 of ${missingConsults.length})`);
    missingConsults.slice(0, 10).forEach(({ key, sourceCount, exportCount }) => {
      console.log(`  - ${key} (source: ${sourceCount}, export: ${exportCount})`);
    });
  }

  console.log(`Consultations with data differences: ${consultDifferences.length}`);
  if (consultDifferences.length > 0 && consultDifferences.length <= 10) {
    consultDifferences.forEach(({ key, patientId, differences: diffs }) => {
      console.log(`\n  Consultation (patient_id: ${patientId}):`);
      diffs.forEach(d => {
        console.log(`    ${d.field}:`);
        console.log(`      Source: ${d.source}`);
        console.log(`      Export: ${d.export}`);
      });
    });
  } else if (consultDifferences.length > 10) {
    console.log(`  (showing first 5 of ${consultDifferences.length})`);
    consultDifferences.slice(0, 5).forEach(({ key, patientId, differences: diffs }) => {
      console.log(`\n  Consultation (patient_id: ${patientId}):`);
      diffs.slice(0, 3).forEach(d => {
        console.log(`    ${d.field}:`);
        console.log(`      Source: ${d.source}`);
        console.log(`      Export: ${d.export}`);
      });
    });
  }

  console.log('\n=== SUMMARY ===');
  console.log(`Patients: ${sourcePatients.length} source, ${exportPatients.length} export (${sourcePatients.length - exportPatients.length} difference)`);
  console.log(`Missing patients: ${missingInExport.length}`);
  console.log(`Patients with data differences: ${differences.length}`);
  console.log(`Consultations: ${sourceConsults.length} source, ${exportConsults.length} export`);
  console.log(`Compared consultations: ${comparedConsults}`);
  console.log(`Consultations for unmapped patients: ${unmappedConsults}`);
  console.log(`Missing consultations: ${missingConsults.length}`);
  console.log(`Consultations with data differences: ${consultDifferences.length}`);
}

compare().catch(console.error);