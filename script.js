const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const dateInput = document.getElementById("todo-date");
const assigneeInput = document.getElementById("todo-assignee");
const list = document.getElementById("todo-list");
const itemCount = document.getElementById("item-count");
const clearBtn = document.getElementById("clear-completed");
const filterBtns = document.querySelectorAll(".filter-btn");
const personFilterSelect = document.getElementById("person-filter");
const loginOverlay = document.getElementById("login-overlay");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubtitle = document.getElementById("auth-subtitle");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const authSubmit = document.getElementById("auth-submit");
const authError = document.getElementById("auth-error");
const authInfo = document.getElementById("auth-info");
const authToggleText = document.getElementById("auth-toggle-text");
const authToggleBtn = document.getElementById("auth-toggle-btn");
const logoutBtn = document.getElementById("logout-btn");

const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let todos = [];
let filter = "all";
let personFilter = "all"; // seçili kişi ("all" = herkes)
let expanded = new Set(); // adım paneli açık olan görevler

// Görevlerdeki kişilere göre açılır listeyi günceller (seçimi korur)
function updatePeopleOptions() {
  const people = [...new Set(todos.map((t) => t.assignee).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "tr")
  );
  // seçili kişi artık yoksa "herkes"e dön
  if (personFilter !== "all" && !people.includes(personFilter)) {
    personFilter = "all";
  }
  personFilterSelect.innerHTML =
    '<option value="all">Herkes</option>' +
    people
      .map((p) => `<option value="${p.replace(/"/g, "&quot;")}">${p}</option>`)
      .join("");
  personFilterSelect.value = personFilter;
}

// Supabase'den görevleri ve adımlarını çekip ön yüz biçimine dönüştürür
async function loadTodos() {
  const [{ data: todoRows, error: e1 }, { data: stepRows, error: e2 }] =
    await Promise.all([
      sb.from("todos").select("*").order("created_at", { ascending: true }),
      sb.from("steps").select("*").order("created_at", { ascending: true }),
    ]);

  if (e1 || e2) {
    console.error("Supabase yükleme hatası:", e1 || e2);
    list.innerHTML =
      '<li class="empty">Veriler yüklenemedi. Bağlantıyı kontrol edin.</li>';
    return;
  }

  const stepsByTodo = {};
  (stepRows || []).forEach((s) => {
    (stepsByTodo[s.todo_id] = stepsByTodo[s.todo_id] || []).push({
      id: s.id,
      text: s.text,
      dueDate: s.due_date,
      completed: s.completed,
    });
  });

  todos = (todoRows || []).map((t) => ({
    id: t.id,
    text: t.text,
    dueDate: t.due_date,
    assignee: t.assignee,
    completed: t.completed,
    steps: stepsByTodo[t.id] || [],
  }));

  render();
}

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function render() {
  list.innerHTML = "";
  const today = todayString();
  updatePeopleOptions();

  const filtered = todos
    .filter((t) => {
      if (personFilter !== "all" && t.assignee !== personFilter) return false;
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      if (filter === "today") {
        return (
          t.dueDate === today ||
          (t.steps || []).some((s) => s.dueDate === today)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });

  if (filtered.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Görev yok 🎉";
    list.appendChild(li);
  }

  filtered.forEach((todo) => {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " completed" : "");

    const row = document.createElement("div");
    row.className = "todo-row";
    li.append(row);

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.addEventListener("change", () => toggle(todo.id));

    const span = document.createElement("span");
    span.className = "text";
    span.textContent = todo.text;

    row.append(checkbox, span);

    let dueEl;
    if (todo.dueDate) {
      dueEl = document.createElement("span");
      dueEl.className = "due";
      dueEl.title = "Tarihi düzenle";
      const d = new Date(todo.dueDate + "T00:00:00");
      const todayMid = new Date();
      todayMid.setHours(0, 0, 0, 0);
      if (!todo.completed && d < todayMid) dueEl.classList.add("overdue");
      if (todo.dueDate === today) dueEl.classList.add("today");
      dueEl.textContent = "📅 " + d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } else {
      dueEl = document.createElement("button");
      dueEl.className = "add-date-btn";
      dueEl.title = "Tarih ekle";
      dueEl.textContent = "📅 +";
    }
    dueEl.addEventListener("click", () => startDateEdit(todo, li, dueEl));
    row.append(dueEl);

    let personEl;
    if (todo.assignee) {
      personEl = document.createElement("span");
      personEl.className = "assignee";
      personEl.title = "Atanan kişiyi düzenle";
      personEl.textContent = "👤 " + todo.assignee;
    } else {
      personEl = document.createElement("button");
      personEl.className = "add-person-btn";
      personEl.title = "Kişi ata";
      personEl.textContent = "👤 +";
    }
    personEl.addEventListener("click", () => startAssigneeEdit(todo, li, personEl));
    row.append(personEl);

    span.addEventListener("dblclick", () => startEdit(todo, li, span));

    const steps = todo.steps || [];
    const stepsToggle = document.createElement("button");
    stepsToggle.className = "steps-toggle";
    stepsToggle.title = "Uygulama adımları";
    const doneCount = steps.filter((s) => s.completed).length;
    const hasTodayStep = steps.some((s) => s.dueDate === today);
    const isOpen = expanded.has(todo.id) || (filter === "today" && hasTodayStep);
    stepsToggle.textContent =
      (isOpen ? "▾" : "▸") +
      " Adımlar" +
      (steps.length ? ` ${doneCount}/${steps.length}` : "");
    stepsToggle.addEventListener("click", () => {
      if (expanded.has(todo.id)) expanded.delete(todo.id);
      else expanded.add(todo.id);
      render();
    });
    row.append(stepsToggle);

    const edit = document.createElement("button");
    edit.className = "edit-btn";
    edit.textContent = "✎";
    edit.title = "Düzenle";
    edit.addEventListener("click", () => startEdit(todo, li, span));

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "✕";
    del.addEventListener("click", () => remove(todo.id));

    row.append(edit, del);

    if (isOpen) li.append(buildStepsPanel(todo, steps, filter === "today"));

    list.appendChild(li);
  });

  const remaining = todos.filter((t) => !t.completed).length;
  itemCount.textContent = `${remaining} görev kaldı`;
}

async function addTodo(text, dueDate, assignee) {
  const { error } = await sb.from("todos").insert({
    text,
    due_date: dueDate || null,
    assignee: assignee || null,
    completed: false,
  });
  if (error) return console.error("Görev eklenemedi:", error);
  await loadTodos();
}

async function toggle(id) {
  const todo = todos.find((t) => t.id === id);
  if (!todo) return;
  const { error } = await sb
    .from("todos")
    .update({ completed: !todo.completed })
    .eq("id", id);
  if (error) return console.error("Güncellenemedi:", error);
  await loadTodos();
}

function startEdit(todo, li, span) {
  if (li.querySelector(".edit-input")) return; // zaten düzenleniyor

  const editInput = document.createElement("input");
  editInput.type = "text";
  editInput.className = "edit-input";
  editInput.value = todo.text;
  span.replaceWith(editInput);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  async function commit() {
    const newText = editInput.value.trim();
    if (newText && newText !== todo.text) {
      const { error } = await sb
        .from("todos")
        .update({ text: newText })
        .eq("id", todo.id);
      if (error) console.error("Güncellenemedi:", error);
      await loadTodos();
    } else {
      render();
    }
  }

  editInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    else if (e.key === "Escape") render();
  });
  editInput.addEventListener("blur", commit);
}

function startDateEdit(todo, li, dueEl) {
  if (li.querySelector(".date-edit-input")) return;

  const dateEdit = document.createElement("input");
  dateEdit.type = "date";
  dateEdit.className = "date-edit-input";
  if (todo.dueDate) dateEdit.value = todo.dueDate;
  dueEl.replaceWith(dateEdit);
  dateEdit.focus();

  let done = false;
  async function commit() {
    if (done) return;
    done = true;
    const { error } = await sb
      .from("todos")
      .update({ due_date: dateEdit.value || null })
      .eq("id", todo.id);
    if (error) console.error("Güncellenemedi:", error);
    await loadTodos();
  }

  dateEdit.addEventListener("change", commit);
  dateEdit.addEventListener("keydown", (e) => {
    if (e.key === "Escape") render();
  });
  dateEdit.addEventListener("blur", commit);
}

function startAssigneeEdit(todo, li, personEl) {
  if (li.querySelector(".assignee-edit-input")) return;

  const nameEdit = document.createElement("input");
  nameEdit.type = "text";
  nameEdit.className = "assignee-edit-input";
  nameEdit.placeholder = "Kim yapacak?";
  if (todo.assignee) nameEdit.value = todo.assignee;
  personEl.replaceWith(nameEdit);
  nameEdit.focus();
  nameEdit.setSelectionRange(nameEdit.value.length, nameEdit.value.length);

  let done = false;
  async function commit() {
    if (done) return;
    done = true;
    const name = nameEdit.value.trim();
    const { error } = await sb
      .from("todos")
      .update({ assignee: name || null })
      .eq("id", todo.id);
    if (error) console.error("Güncellenemedi:", error);
    await loadTodos();
  }

  nameEdit.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    else if (e.key === "Escape") render();
  });
  nameEdit.addEventListener("blur", commit);
}

function buildStepsPanel(todo, steps, todayOnly) {
  const panel = document.createElement("div");
  panel.className = "steps-panel";
  panel.dataset.todoId = todo.id;

  const today = todayString();
  const visibleSteps = todayOnly
    ? steps.filter((s) => s.dueDate === today)
    : steps;

  const stepList = document.createElement("ul");
  stepList.className = "step-list";

  if (visibleSteps.length === 0) {
    const empty = document.createElement("li");
    empty.className = "step-empty";
    empty.textContent = todayOnly
      ? "Bugüne tarihli adım yok."
      : "Henüz adım yok. Aşağıdan ekleyebilirsin.";
    stepList.append(empty);
  }

  const sortedSteps = [...visibleSteps].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  sortedSteps.forEach((step) => {
    const li = document.createElement("li");
    li.className = "step-item" + (step.completed ? " completed" : "");

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = step.completed;
    cb.addEventListener("change", () => toggleStep(todo.id, step.id));

    const txt = document.createElement("span");
    txt.className = "step-text";
    txt.textContent = step.text;

    li.append(cb, txt);

    let stepDue;
    if (step.dueDate) {
      stepDue = document.createElement("span");
      stepDue.className = "step-due";
      stepDue.title = "Tarihi düzenle";
      const d = new Date(step.dueDate + "T00:00:00");
      const todayMid = new Date();
      todayMid.setHours(0, 0, 0, 0);
      if (!step.completed && d < todayMid) stepDue.classList.add("overdue");
      if (step.dueDate === todayString()) stepDue.classList.add("today");
      stepDue.textContent = "📅 " + d.toLocaleDateString("tr-TR", {
        day: "2-digit",
        month: "short",
      });
    } else {
      stepDue = document.createElement("button");
      stepDue.className = "add-date-btn";
      stepDue.title = "Tarih ekle";
      stepDue.textContent = "📅 +";
    }
    stepDue.addEventListener("click", () =>
      startStepDateEdit(todo.id, step, li, stepDue)
    );
    li.append(stepDue);

    const del = document.createElement("button");
    del.className = "step-del";
    del.textContent = "✕";
    del.title = "Adımı sil";
    del.addEventListener("click", () => removeStep(todo.id, step.id));

    li.append(del);
    stepList.append(li);
  });

  panel.append(stepList);

  const addForm = document.createElement("form");
  addForm.className = "step-form";
  const stepInput = document.createElement("input");
  stepInput.type = "text";
  stepInput.placeholder = todayOnly ? "Bugüne adım ekle..." : "Yeni adım ekle...";
  stepInput.autocomplete = "off";
  const addBtn = document.createElement("button");
  addBtn.type = "submit";
  addBtn.textContent = "+";
  addForm.append(stepInput, addBtn);
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = stepInput.value.trim();
    if (!text) return;
    addStep(todo.id, text, todayOnly ? today : null);
  });
  panel.append(addForm);

  return panel;
}

async function addStep(todoId, text, dueDate) {
  const { error } = await sb.from("steps").insert({
    todo_id: todoId,
    text,
    due_date: dueDate || null,
    completed: false,
  });
  if (error) return console.error("Adım eklenemedi:", error);
  await loadTodos();
  // adım ekledikten sonra ilgili panelin giriş kutusuna odağı geri ver
  const panel = list.querySelector(`.steps-panel[data-todo-id="${todoId}"]`);
  if (panel) panel.querySelector(".step-form input").focus();
}

async function toggleStep(todoId, stepId) {
  const todo = todos.find((t) => t.id === todoId);
  const step = todo && todo.steps.find((s) => s.id === stepId);
  if (!step) return;
  const { error } = await sb
    .from("steps")
    .update({ completed: !step.completed })
    .eq("id", stepId);
  if (error) return console.error("Güncellenemedi:", error);
  await loadTodos();
}

function startStepDateEdit(todoId, step, li, dueEl) {
  if (li.querySelector(".date-edit-input")) return;

  const dateEdit = document.createElement("input");
  dateEdit.type = "date";
  dateEdit.className = "date-edit-input";
  if (step.dueDate) dateEdit.value = step.dueDate;
  dueEl.replaceWith(dateEdit);
  dateEdit.focus();

  let done = false;
  async function commit() {
    if (done) return;
    done = true;
    const { error } = await sb
      .from("steps")
      .update({ due_date: dateEdit.value || null })
      .eq("id", step.id);
    if (error) console.error("Güncellenemedi:", error);
    await loadTodos();
  }

  dateEdit.addEventListener("change", commit);
  dateEdit.addEventListener("keydown", (e) => {
    if (e.key === "Escape") render();
  });
  dateEdit.addEventListener("blur", commit);
}

async function removeStep(todoId, stepId) {
  const { error } = await sb.from("steps").delete().eq("id", stepId);
  if (error) return console.error("Adım silinemedi:", error);
  await loadTodos();
}

async function remove(id) {
  const { error } = await sb.from("todos").delete().eq("id", id);
  if (error) return console.error("Görev silinemedi:", error);
  await loadTodos();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  await addTodo(text, dateInput.value, assigneeInput.value.trim());
  input.value = "";
  dateInput.value = "";
  assigneeInput.value = "";
  input.focus();
});

clearBtn.addEventListener("click", async () => {
  const { error } = await sb.from("todos").delete().eq("completed", true);
  if (error) return console.error("Temizlenemedi:", error);
  await loadTodos();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    filter = btn.dataset.filter;
    render();
  });
});

personFilterSelect.addEventListener("change", () => {
  personFilter = personFilterSelect.value;
  render();
});

// --- Oturum / e-posta + şifre ile kayıt ve giriş ---

let authMode = "login"; // "login" | "signup"

function clearAuthMessages() {
  authError.textContent = "";
  authInfo.textContent = "";
}

function setAuthMode(mode) {
  authMode = mode;
  clearAuthMessages();
  if (mode === "signup") {
    authTitle.textContent = "📝 Kayıt ol";
    authSubtitle.textContent = "E-posta ve şifreyle hesap oluştur.";
    authSubmit.textContent = "Kayıt ol";
    authPassword.setAttribute("autocomplete", "new-password");
    authToggleText.textContent = "Zaten hesabın var mı?";
    authToggleBtn.textContent = "Giriş yap";
  } else {
    authTitle.textContent = "🔒 Giriş";
    authSubtitle.textContent = "Listeyi görmek için giriş yap.";
    authSubmit.textContent = "Giriş yap";
    authPassword.setAttribute("autocomplete", "current-password");
    authToggleText.textContent = "Hesabın yok mu?";
    authToggleBtn.textContent = "Kayıt ol";
  }
}

function showLogin() {
  loginOverlay.classList.remove("hidden");
  logoutBtn.classList.add("hidden");
  setAuthMode("login");
  authEmail.focus();
}

function showApp() {
  loginOverlay.classList.add("hidden");
  logoutBtn.classList.remove("hidden");
  loadTodos();
}

authToggleBtn.addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "signup" : "login");
  authPassword.value = "";
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAuthMessages();
  const email = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) {
    authError.textContent = "E-posta ve şifre gerekli.";
    return;
  }

  authSubmit.disabled = true;
  try {
    if (authMode === "signup") {
      if (password.length < 6) {
        authError.textContent = "Şifre en az 6 karakter olmalı.";
        return;
      }
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) {
        authError.textContent = "Kayıt başarısız: " + error.message;
        return;
      }
      if (data.session) {
        // (Onay kapalıysa) doğrudan giriş
        showApp();
      } else {
        // Onay maili gönderildi; giriş moduna geç ama bilgi mesajını koru
        setAuthMode("login");
        authEmail.value = email;
        authPassword.value = "";
        authInfo.textContent =
          `Onay maili ${email} adresine gönderildi. Linke tıkladıktan sonra giriş yapabilirsin.`;
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = (error.message || "").toLowerCase();
        if (msg.includes("not confirmed")) {
          authError.textContent =
            "E-postanı henüz onaylamadın. Gelen kutunu kontrol et.";
        } else {
          authError.textContent = "E-posta veya şifre hatalı.";
        }
        return;
      }
      showApp();
    }
  } finally {
    authSubmit.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  await sb.auth.signOut();
  todos = [];
  render();
  showLogin();
});

async function init() {
  const { data } = await sb.auth.getSession();
  if (data.session) showApp();
  else showLogin();
}

init();
