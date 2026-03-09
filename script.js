let subjects = [];
let streak = 0;
let testHistory = [];
let savedTimetableHTML = "";
let currentUser = null;
let currentActiveQuestions = [];

const questionBank = {
  math: [{ q: "What is 12 * 8?", a: "96" }, { q: "Solve for x: 2x + 5 = 15", a: "5" }, { q: "Square root of 144?", a: "12" }],
  science: [{ q: "Symbol for Gold?", a: "Au" }, { q: "Red Planet?", a: "Mars" }, { q: "Boiling point of water?", a: "100" }],
  general: [{ q: "Capital of France?", a: "Paris" }, { q: "Number of continents?", a: "7" }, { q: "WWII end year?", a: "1945" }]
};

const aiLogic = {
  getLevel: (n) => n.toLowerCase().includes("math") ? { l: "Advanced", w: 3 } : { l: "Standard", w: 1 },
  getTech: (n) => n.toLowerCase().includes("math") ? "Active problem solving and formula derivation." : "The Feynman Technique: Teach the concept to someone else."
};

// --- AUTH LOGIC ---
function switchAuthTab(role){
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${role}-btn`).classList.add('active');
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`${role}-form`).classList.add('active');
}

function showStudentRegister(){ switchAuthTab('student'); document.getElementById('student-form').classList.remove('active'); document.getElementById('student-register-form').classList.add('active'); }
function showStudentLogin(){ switchAuthTab('student'); }
function showParentRegister(){ switchAuthTab('parent'); document.getElementById('parent-form').classList.remove('active'); document.getElementById('parent-register-form').classList.add('active'); }
function showParentLogin(){ switchAuthTab('parent'); }

function studentAuth(){
  const user = document.getElementById('student-user').value.trim();
  const pass = document.getElementById('student-pass').value.trim();
  let db = JSON.parse(localStorage.getItem("portal_students")) || [];
  let found = db.find(u => u.username === user && u.password === pass);
  if(found){
    currentUser = {...found, role: "student"};
    loadStudentData(found);
    startApp();
  } else alert("Invalid Student Credentials.");
}

function studentRegister(){
  const user = document.getElementById('sreg-user').value.trim();
  const pass = document.getElementById('sreg-pass').value.trim();
  const name = document.getElementById('sreg-name').value.trim();
  if(!user || !pass) return alert("User/Pass required");
  let db = JSON.parse(localStorage.getItem("portal_students")) || [];
  if(db.find(u => u.username === user)) return alert("Username taken");
  db.push({username:user, password:pass, name:name, subjects:[], streak:0, testHistory:[], timetableHTML: "", gpa: document.getElementById('sreg-gpa').value || "0.0"});
  localStorage.setItem("portal_students", JSON.stringify(db));
  alert("Registered! Login now.");
  showStudentLogin();
}

function parentAuth(){
  const user = document.getElementById('parent-user').value.trim();
  const pass = document.getElementById('parent-pass').value.trim();
  let pDb = JSON.parse(localStorage.getItem("portal_parents")) || [];
  let parentFound = pDb.find(u => u.username === user && u.password === pass);
  
  if(parentFound){
    let sDb = JSON.parse(localStorage.getItem("portal_students")) || [];
    let wardData = sDb.find(s => s.username === parentFound.linkID);
    if(!wardData) return alert("Linked Ward not found.");

    currentUser = {...parentFound, role: "parent", wardName: wardData.name, gpa: wardData.gpa};
    loadStudentData(wardData);
    startApp();
  } else alert("Invalid Parent Credentials.");
}

function parentRegister(){
  const user = document.getElementById('preg-user').value.trim();
  const pass = document.getElementById('preg-pass').value.trim();
  const wardID = document.getElementById('preg-link-id').value.trim();
  let sDb = JSON.parse(localStorage.getItem("portal_students")) || [];
  if(!sDb.find(s => s.username === wardID)) return alert("Ward ID (Student Username) does not exist!");
  
  let pDb = JSON.parse(localStorage.getItem("portal_parents")) || [];
  pDb.push({username:user, password:pass, name: document.getElementById('preg-name').value, linkID: wardID});
  localStorage.setItem("portal_parents", JSON.stringify(pDb));
  alert("Parent account created!");
  showParentLogin();
}

function loadStudentData(data){
  subjects = data.subjects || [];
  streak = data.streak || 0;
  testHistory = data.testHistory || [];
  savedTimetableHTML = data.timetableHTML || "<p style='color:var(--muted); text-align:center;'>No timetable generated yet.</p>";
}

// --- APP LOGIC ---
function startApp(){
  document.getElementById("auth-overlay").classList.add("hidden");
  document.getElementById("app-body").classList.remove("hidden");
  document.body.className = currentUser.role === "parent" ? "parent-view" : "";
  
  document.getElementById("side-profile").innerHTML = `<b>${currentUser.name}</b><br>${currentUser.role === 'parent' ? 'PARENT OF ' + currentUser.wardName : 'STUDENT'}`;
  document.getElementById("welcome-sub").innerText = currentUser.role === 'parent' ? `Monitoring progress for ${currentUser.wardName}` : "Your portal is synchronized.";
  document.getElementById("gpa-display").innerText = currentUser.gpa || "0.0";

  updateUI();
  updateHistoryUI();
  updateProgress();
  populateTestSubjects();
  
  document.getElementById("ttOutput").innerHTML = savedTimetableHTML;
  
  if(currentUser.role === "parent") generatePlan(); 
}

function addSubject() {
  let val = document.getElementById("subjectInput").value.trim();
  if (!val) return;
  let info = aiLogic.getLevel(val);
  subjects.push({ name: val, level: info.l, weight: info.w, mastery: Math.floor(Math.random() * 20) + 10 });
  document.getElementById("subjectInput").value = "";
  saveData(); updateUI(); updateProgress(); populateTestSubjects();
}

function updateUI() {
  document.getElementById("subjectList").innerHTML = subjects.map(s => `<span class="subject-tag">${s.name}</span>`).join("");
  document.getElementById("subjectCount").innerText = subjects.length;
  document.getElementById("streakText").innerText = `🔥 ${streak}`;
}

function updateProgress() {
    let goalPercent = Math.min((streak / 7) * 100, 100);
    document.getElementById("mainProgressBar").style.width = goalPercent + "%";
    document.getElementById("progressText").innerText = Math.round(goalPercent) + "% of weekly goal achieved";
    document.getElementById("statStreak").innerText = streak;
    document.getElementById("statTests").innerText = testHistory.length;
    document.getElementById("masteryList").innerHTML = subjects.length > 0 ? subjects.map(s => `
        <div style="margin-bottom:15px;">
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:5px;"><span>${s.name}</span><span>${s.mastery || 15}%</span></div>
            <div class="progress-container" style="height:6px; margin:0;"><div class="progress-bar" style="width:${s.mastery || 15}%"></div></div>
        </div>`).join("") : "Add subjects to see mastery.";
}

function updateHistoryUI() {
  const container = document.getElementById("testHistoryList");
  container.innerHTML = testHistory.length === 0 ? "No tests completed." : testHistory.map(h =>
    `<div class="history-item"><span><strong>${h.subject}</strong> <small>(${h.date})</small></span><span style="color:var(--primary); font-weight:bold;">${h.score}/${h.total}</span></div>`
  ).join("");
}

function populateTestSubjects() {
  const select = document.getElementById("testSubjectSelect");
  if(!select) return;
  let opts = `<option value="general">General Knowledge</option>`;
  subjects.forEach(s => { opts += `<option value="${s.name.toLowerCase()}">${s.name}</option>`; });
  select.innerHTML = opts;
}

function startNewTest() {
  const key = document.getElementById("testSubjectSelect").value;
  const count = parseInt(document.getElementById("testQuestionCount").value);
  let pool = questionBank[key] || questionBank["general"];
  currentActiveQuestions = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);
  document.getElementById("dynamicQuestionsContainer").innerHTML = currentActiveQuestions.map((q,i)=>`
    <div style="margin-bottom:15px;"><p><strong>Q${i+1}:</strong> ${q.q}</p><input type="text" id="ans-${i}" placeholder="Answer..." /></div>`).join("");
  document.getElementById("test-config-view").classList.add("hidden");
  document.getElementById("test-active-view").classList.remove("hidden");
}

function submitDynamicTest() {
  let score = 0;
  currentActiveQuestions.forEach((q,i)=>{ if(document.getElementById(`ans-${i}`).value.trim().toLowerCase() === q.a.toLowerCase()) score++; });
  testHistory.unshift({ subject: document.getElementById("testSubjectSelect").selectedOptions[0].text, score: score, total: currentActiveQuestions.length, date: new Date().toLocaleDateString() });
  
  const subName = document.getElementById("testSubjectSelect").value;
  let sIndex = subjects.findIndex(s => s.name.toLowerCase() === subName);
  if(sIndex > -1) subjects[sIndex].mastery = Math.min((subjects[sIndex].mastery || 0) + 10, 100);

  saveData(); updateHistoryUI(); updateProgress();
  document.getElementById("testScoreDisplay").innerText = `Score: ${score} / ${currentActiveQuestions.length}`;
  document.getElementById("test-active-view").classList.add("hidden");
  document.getElementById("test-result-view").classList.remove("hidden");
}

function resetTest() { document.getElementById("test-result-view").classList.add("hidden"); document.getElementById("test-config-view").classList.remove("hidden"); }

function generatePlan() {
  let html = subjects.map(s => `<div class="plan-item"><h4>${s.name}</h4><p>${aiLogic.getTech(s.name)}</p></div>`).join("");
  document.getElementById("planOutput").innerHTML = html || "No subjects added.";
}

function generateTimetable() {
  if (subjects.length === 0) return alert("Add subjects first!");
  let startH = parseInt(document.getElementById("startTime").value), endH = parseInt(document.getElementById("endTime").value);
  if (endH <= startH) return alert("Invalid time range");
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  let html = "<table><tr><th>Day</th>";
  for (let h = startH; h < endH; h++) html += `<th>${h}:00</th>`;
  html += "</tr>";
  days.forEach((day, di) => {
    html += `<tr><td><strong>${day}</strong></td>`;
    for (let h = startH; h < endH; h++) html += `<td style="color:var(--primary);">${subjects[(di + h) % subjects.length].name}</td>`;
    html += "</tr>";
  });
  
  savedTimetableHTML = html + "</table>";
  document.getElementById("ttOutput").innerHTML = savedTimetableHTML;
  saveData(); 
}

function summarize() {
    let input = document.getElementById("sumInput").value.trim();
    if (!input) return;
    let segments = input.split(/[.?!]+/).filter(s => s.trim().length > 5);
    let html = `<strong style="color:var(--primary);">✨ AI Key Takeaways</strong><ul style="margin-top:10px; padding-left:20px;">`;
    segments.slice(0, 5).forEach(s => html += `<li style="margin-bottom:8px;">${s.trim()}.</li>`);
    document.getElementById("sumOutput").innerHTML = html + "</ul>";
}

function markStudied(){ streak++; saveData(); updateUI(); updateProgress(); }

function showPage(id, btn){
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
  document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("page-title").innerText = btn.innerText.replace('📊 ', '').replace('📝 ', '');
}

function logout(){ location.reload(); }

function saveData(){
  if(currentUser && currentUser.role === "student"){
    let db = JSON.parse(localStorage.getItem("portal_students")) || [];
    let idx = db.findIndex(s=>s.username === currentUser.username);
    if(idx > -1){
      db[idx] = {...db[idx], subjects, streak, testHistory, timetableHTML: savedTimetableHTML};
      localStorage.setItem("portal_students", JSON.stringify(db));
    }
  }
}