let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

function searchNotes(word) {
  const search = word.toLowerCase();
  return notes.filter((note) => note.text.toLowerCase().includes(search));
}

console.log(searchNotes("the"));

console.log(searchNotes("JAVASCRIPT"));

console.log(searchNotes("zebra"));


function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];
  for (const note of notes) {
    if (note.text.length > longest.text.length) {
      longest = note;
    }
  }
  return longest;
}

console.log(longestNote());

const backupNotes = notes;
notes = [];
console.log(longestNote());

notes = backupNotes;

function countByCategory() {
  const counts = {};
  for (const note of notes) {
    if (counts[note.category]) {
      counts[note.category] += 1;
    } else {
      counts[note.category] = 1;
    }
  }
  return counts;
}

console.log(countByCategory());

const backupNotes2 = notes;
notes = [];
console.log(countByCategory());

notes = backupNotes2;


function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const word = total === 1 ? "note" : "notes";

  const personal = counts.personal || 0;
  const work = counts.work || 0;
  const study = counts.study || 0;

  return `${total} ${word}: ${personal} personal, ${work} work, ${study} study.`;
}

console.log(getSummary());

const backupNotes3 = notes;
notes = [backupNotes3[0]];
console.log(getSummary());

notes = [];
console.log(getSummary());

notes = backupNotes3;

function isDuplicate(text) {
  const clean = text.trim().toLowerCase().replace(/\s+/g, " ");
  return notes.some(
    (note) => note.text.trim().toLowerCase().replace(/\s+/g, " ") === clean
  );
}

console.log(isDuplicate("Call mum"));

console.log(isDuplicate("  buy MILK   and bread  "));

console.log(isDuplicate("Buy eggs"));

function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];
  const clean = text.trim();

  if (clean.length < 1 || clean.length > 200) {
    console.log("Not added: text must be 1-200 characters.");
    return false;
  }
  if (isDuplicate(clean)) {
    console.log("Not added: this note already exists.");
    return false;
  }
  if (!validCategories.includes(category)) {
    console.log("Not added: category must be personal, work or study.");
    return false;
  }

  const newId = notes.length > 0 ? Math.max(...notes.map((n) => n.id)) + 1 : 1;
  notes.push({ id: newId, text: clean, category: category });
  return true;
}

console.log(addNote("", "work"));

console.log(addNote("a".repeat(201), "work"));

console.log(addNote("call MUM", "personal"));

console.log(addNote("Buy eggs", "hobby"));

console.log(addNote("Buy eggs", "personal"));

console.log(getSummary());
