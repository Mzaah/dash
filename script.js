// --- HJÄLPFUNKTIONER ---
function getLocalDayString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getLocalDayString(new Date());


// --- TO-DO LISTA LOGIK ---
let todos = JSON.parse(localStorage.getItem('ghost_todos')) || [];
let lastTodoDate = localStorage.getItem('ghost_todo_date');

if (lastTodoDate !== todayStr) {
  todos = [];
  localStorage.setItem('ghost_todos', JSON.stringify(todos));
  localStorage.setItem('ghost_todo_date', todayStr);
}

function saveTodos() { localStorage.setItem('ghost_todos', JSON.stringify(todos)); }

function renderTodos() {
  const list = document.getElementById('todo-list');
  list.innerHTML = '';
  
  todos.forEach((todo, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    if(todo.checked) item.classList.add('checked');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'list-checkbox';
    checkbox.checked = todo.checked;
    
    checkbox.addEventListener('change', (e) => {
      todo.checked = e.target.checked;
      if(todo.checked) item.classList.add('checked');
      else item.classList.remove('checked');
      saveTodos();
    });
    
    const text = document.createElement('span');
    text.className = 'list-text';
    text.textContent = todo.text;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'list-delete';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', () => {
      todos.splice(index, 1);
      saveTodos();
      renderTodos();
    });
    
    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

document.getElementById('add-todo-btn').addEventListener('click', addTodo);
document.getElementById('new-todo-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo();
});

function addTodo() {
  const input = document.getElementById('new-todo-input');
  const val = input.value.trim();
  if (val) {
    todos.push({ text: val, checked: false });
    saveTodos();
    renderTodos();
    input.value = '';
  }
}


// --- VECKOPLANERARE LOGIK ---
const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const plannerContainer = document.getElementById('planner-container');

function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function initializePlanner() {
  DAYS.forEach(day => {
    const block = document.createElement('div');
    block.className = 'day-block';

    const title = document.createElement('h3');
    title.className = 'day-title';
    title.innerHTML = `<span style="color: var(--text-muted);">•</span> ${day}`;

    const textarea = document.createElement('textarea');
    textarea.placeholder = "Skriv något...";
    textarea.setAttribute('rows', '1');
    
    const savedPlan = localStorage.getItem(`notion_plan_${day}`);
    if (savedPlan) {
      textarea.value = savedPlan;
      setTimeout(() => autoResize(textarea), 0);
    }

    textarea.addEventListener('input', (e) => {
      localStorage.setItem(`notion_plan_${day}`, e.target.value);
      autoResize(e.target);
    });

    block.appendChild(title);
    block.appendChild(textarea);
    plannerContainer.appendChild(block);
  });
}


// --- HABIT TRACKER & HEATMAP LOGIK ---
let habits = JSON.parse(localStorage.getItem('ghost_habits')) || ['Träning', 'Läsning'];
let habitData = JSON.parse(localStorage.getItem('ghost_habit_data')) || {};

if (!habitData[todayStr]) {
  habitData[todayStr] = { checked: [], total: habits.length };
} else {
  habitData[todayStr].total = habits.length; 
}

function saveHabitData() {
  localStorage.setItem('ghost_habits', JSON.stringify(habits));
  localStorage.setItem('ghost_habit_data', JSON.stringify(habitData));
  renderHeatmap();
  updateStats();
}

function renderHabits() {
  const list = document.getElementById('habit-list');
  list.innerHTML = '';
  
  habits.forEach((habit, index) => {
    const item = document.createElement('div');
    item.className = 'list-item';
    
    const isChecked = habitData[todayStr].checked.includes(habit);
    if(isChecked) item.classList.add('checked');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'list-checkbox';
    checkbox.checked = isChecked;
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!habitData[todayStr].checked.includes(habit)) habitData[todayStr].checked.push(habit);
        item.classList.add('checked');
      } else {
        habitData[todayStr].checked = habitData[todayStr].checked.filter(h => h !== habit);
        item.classList.remove('checked');
      }
      saveHabitData();
    });
    
    const text = document.createElement('span');
    text.className = 'list-text';
    text.textContent = habit;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'list-delete';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', () => {
      habits.splice(index, 1);
      habitData[todayStr].checked = habitData[todayStr].checked.filter(h => h !== habit);
      habitData[todayStr].total = habits.length;
      saveHabitData();
      renderHabits();
    });
    
    item.appendChild(checkbox);
    item.appendChild(text);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

document.getElementById('add-habit-btn').addEventListener('click', addHabit);
document.getElementById('new-habit-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') addHabit(); });

function addHabit() {
  const input = document.getElementById('new-habit-input');
  const val = input.value.trim();
  if (val && !habits.includes(val)) {
    habits.push(val);
    habitData[todayStr].total = habits.length;
    saveHabitData();
    renderHabits();
    input.value = '';
  }
}

function renderHeatmap() {
  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  
  const numDays = 364; 
  const today = new Date();
  
  const firstDate = new Date(today);
  firstDate.setDate(today.getDate() - numDays);
  let startDay = firstDate.getDay(); 
  startDay = startDay === 0 ? 6 : startDay - 1; 
  
  for(let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'heatmap-cell empty';
    empty.style.backgroundColor = 'transparent';
    heatmap.appendChild(empty);
  }

  for (let i = numDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDayString(d);
    
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.title = dateStr; 
    
    const data = habitData[dateStr];
    if (data && data.total > 0) {
      const percentage = data.checked.length / data.total;
      if (percentage > 0) {
        if (percentage <= 0.25) cell.classList.add('color-1');
        else if (percentage <= 0.5) cell.classList.add('color-2');
        else if (percentage <= 0.75) cell.classList.add('color-3');
        else cell.classList.add('color-4');
      }
    }
    heatmap.appendChild(cell);
  }

  const wrapper = document.querySelector('.heatmap-wrapper');
  wrapper.scrollLeft = wrapper.scrollWidth;
}


// --- STATS LOGIK (År & Streak) ---
function updateStats() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const percent = ((now - start) / (end - start)) * 100;
  
  document.getElementById('year-percent').textContent = percent.toFixed(1) + '%';
  document.getElementById('year-label').textContent = `av ${now.getFullYear()} avklarat`;
  
  setTimeout(() => {
    document.getElementById('year-progress-fill').style.width = percent + '%';
  }, 100);

  let currentStreak = 0;
  const today = new Date();
  
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDayString(d);
    
    const data = habitData[dateStr];
    
    if (data && data.checked && data.checked.length > 0) {
      currentStreak++;
    } else {
      if (i === 0) {
        continue;
      } else {
        break; 
      }
    }
  }
  
  document.getElementById('streak-counter').textContent = currentStreak;
}


// --- STARTA APPEN ---
renderTodos();
initializePlanner();
renderHabits();
renderHeatmap();
updateStats();
