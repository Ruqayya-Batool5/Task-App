const TASKS_KEY = "todo_tasks_v2";
let tasks = loadTasks();

const addTaskBtn = document.getElementById("addTaskBtn");
const taskListEl = document.getElementById("taskList");
const allTasksHeading = document.getElementById("allTasksHeading");

setMinDate();
renderTasks();
addTaskBtn.addEventListener("click", addTask);

function loadTasks() {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

function setMinDate() {
  const deadlineInput = document.getElementById("taskDeadline");
  if (!deadlineInput) return;
  const now = new Date();
  const iso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
  deadlineInput.min = iso;
}

// ✅ Always return date with only 4 digit year
function formatDateTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear().toString().slice(0, 4);
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");

  return `${day}-${month}-${year} ${hours}:${mins}`;
}

// ✅ Year validation (2000–2030 only)
function isValidYear(deadline) {
  const d = new Date(deadline);
  if (isNaN(d.getTime())) return false;
  const year = d.getFullYear();
  return year >= 2000 && year <= 2030;
}

function renderTasks() {
  taskListEl.innerHTML = "";
  allTasksHeading.style.display = tasks.length ? "block" : "none";

  tasks.forEach((task, idx) => {
    const card = document.createElement("div");
    card.className = "task-card";
    if (task.completed) card.classList.add("completed");

    card.innerHTML = `
      <div class="task-number">Task ${idx + 1}</div>
      <div class="task-title">${task.title}</div>
      ${task.description ? `<div class="task-description">${task.description}</div>` : ""}
      ${task.notes ? `<div class="task-notes">Notes: ${task.notes}</div>` : ""}
      <div class="task-info">
        Created: ${formatDateTime(task.createdAt)}
        ${task.deadline ? " | Deadline: " + formatDateTime(task.deadline) : ""}
      </div>
      <div class="task-buttons">
        <button class="btn-add-subtask">Add Subtask</button>
        <button class="btn-edit-task">Edit</button>
        <button class="btn-delete-task">Delete</button>
      </div>
      <div class="subtasks"></div>
    `;

    card.querySelector(".btn-add-subtask").addEventListener("click", () => showSubtaskForm(task.id, card));
    card.querySelector(".btn-edit-task").addEventListener("click", () => showEditTask(task.id, card));
    card.querySelector(".btn-delete-task").addEventListener("click", () => deleteTask(task.id));

    const subtasksDiv = card.querySelector(".subtasks");
    if (task.subtasks.length > 0) {
      const heading = document.createElement("div");
      heading.className = "subtasks-heading";
      heading.textContent = "Subtasks";
      subtasksDiv.appendChild(heading);

      task.subtasks.forEach((sub) => {
        const subItem = document.createElement("div");
        subItem.className = "subtask-item";
        subItem.innerHTML = `
          <div class="subtask-title">${sub.title}</div>
          ${sub.description ? `<div class="subtask-description">${sub.description}</div>` : ""}
          <div class="subtask-buttons">
            <button class="btn-edit-sub">Edit</button>
            <button class="btn-delete-sub">Delete</button>
          </div>
        `;
        subItem.querySelector(".btn-edit-sub").addEventListener("click", () =>
          showEditSubtask(task.id, sub.id, subItem)
        );
        subItem.querySelector(".btn-delete-sub").addEventListener("click", () =>
          deleteSubtask(task.id, sub.id)
        );
        subtasksDiv.appendChild(subItem);
      });
    }

    taskListEl.appendChild(card);
  });
}

function addTask() {
  const title = document.getElementById("taskTitle").value.trim();
  const desc = document.getElementById("taskDescription").value.trim();
  let deadline = document.getElementById("taskDeadline").value;
  const notes = document.getElementById("extraNotes").value.trim();

  if (!title) return alert("Enter task title!");

  if (deadline) {
    if (!isValidYear(deadline)) {
      alert("Year must be between 2000 and 2030!");
      return;
    }
  } else {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    deadline = d.toISOString();
  }

  const newTask = {
    id: "t_" + Date.now(),
    title,
    description: desc,
    notes,
    deadline,
    createdAt: new Date().toISOString(),
    completed: false,
    subtasks: [],
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  document.getElementById("taskTitle").value = "";
  document.getElementById("taskDescription").value = "";
  document.getElementById("taskDeadline").value = "";
  document.getElementById("extraNotes").value = "";
}

function deleteTask(taskId) {
  tasks = tasks.filter((t) => t.id !== taskId);
  saveTasks();
  renderTasks();
}

function showEditTask(taskId, card) {
  const task = tasks.find((t) => t.id === taskId);
  if (!task || card.querySelector(".edit-fields")) return;

  const editDiv = document.createElement("div");
  editDiv.className = "edit-fields";
  editDiv.innerHTML = `
    <input type="text" class="edit-title" value="${task.title}">
    <textarea class="edit-desc">${task.description}</textarea>
    <input type="datetime-local" class="edit-deadline" value="${
      task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : ""
    }">
    <textarea class="edit-notes">${task.notes}</textarea>
    <div class="edit-actions">
      <button class="save-edit">Save</button>
      <button class="cancel-edit">Cancel</button>
    </div>
  `;
  card.insertBefore(editDiv, card.querySelector(".task-buttons"));

  editDiv.querySelector(".save-edit").addEventListener("click", () => {
    const newDeadline = editDiv.querySelector(".edit-deadline").value;
    if (newDeadline) {
      if (!isValidYear(newDeadline)) {
        alert("Year must be between 2000 and 2030!");
        return;
      }
      task.deadline = newDeadline;
    }
    task.title = editDiv.querySelector(".edit-title").value.trim();
    task.description = editDiv.querySelector(".edit-desc").value.trim();
    task.notes = editDiv.querySelector(".edit-notes").value.trim();
    saveTasks();
    renderTasks();
  });

  editDiv.querySelector(".cancel-edit").addEventListener("click", () => editDiv.remove());
}

function showSubtaskForm(taskId, card) {
  const subDiv = card.querySelector(".subtasks");
  if (subDiv.querySelector(".subtask-form")) return;

  const form = document.createElement("div");
  form.className = "subtask-form";
  form.innerHTML = `
    <input type="text" class="subtask-input-title" placeholder="Subtask Title">
    <textarea class="subtask-input-desc" placeholder="Subtask Description"></textarea>
    <div class="subtask-buttons">
      <button class="save-subtask">Save</button>
      <button class="cancel-subtask">Cancel</button>
    </div>
  `;
  subDiv.appendChild(form);

  form.querySelector(".save-subtask").addEventListener("click", () => {
    const title = form.querySelector(".subtask-input-title").value.trim();
    const desc = form.querySelector(".subtask-input-desc").value.trim();
    if (!title) return alert("Enter subtask title!");
    const task = tasks.find((t) => t.id === taskId);
    task.subtasks.push({
      id: "s_" + Date.now(),
      title,
      description: desc,
      completed: false,
    });
    saveTasks();
    renderTasks();
  });

  form.querySelector(".cancel-subtask").addEventListener("click", () => form.remove());
}

function showEditSubtask(taskId, subId, subItem) {
  const task = tasks.find((t) => t.id === taskId);
  const sub = task.subtasks.find((s) => s.id === subId);
  if (!sub || subItem.querySelector(".edit-fields")) return;

  const editDiv = document.createElement("div");
  editDiv.className = "edit-fields";
  editDiv.innerHTML = `
    <input type="text" class="edit-sub-title" value="${sub.title}">
    <textarea class="edit-sub-desc">${sub.description}</textarea>
    <div class="edit-actions">
      <button class="save-edit-sub">Save</button>
      <button class="cancel-edit-sub">Cancel</button>
    </div>
  `;
  subItem.appendChild(editDiv);

  editDiv.querySelector(".save-edit-sub").addEventListener("click", () => {
    sub.title = editDiv.querySelector(".edit-sub-title").value.trim();
    sub.description = editDiv.querySelector(".edit-sub-desc").value.trim();
    saveTasks();
    renderTasks();
  });

  editDiv.querySelector(".cancel-edit-sub").addEventListener("click", () => editDiv.remove());
}

function deleteSubtask(taskId, subId) {
  const task = tasks.find((t) => t.id === taskId);
  task.subtasks = task.subtasks.filter((s) => s.id !== subId);
  saveTasks();
  renderTasks();
}
