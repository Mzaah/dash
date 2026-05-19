// --- HJÄLPFUNKTIONER ---
function getLocalDayString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
const todayStr = getLocalDayString(new Date());

// --- DYNAMISK HÄLSNING ---
function updateGreeting() {
  const hour = new Date().getHours();
  const greetingEl = document.getElementById('greeting-title');
  if (hour < 10) {
    greetingEl.textContent = "God morgon, Liam. 🙏";
  } else if (hour < 18) {
    greetingEl.textContent = "God dag, Liam. 🙏";
  } else {
    greetingEl.textContent = "God kväll, Liam. 🙏";
  }
}

// --- FLIKAR (TABS) LOGIK ---
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.target).classList.add('active');
    
    // Rita upp grafen när man klickar på Hälsa-fliken för att undvika grafikbuggar
    if (btn.dataset.target === 'tab-health') {
      renderWeightChart();
    }
  });
});

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

if (!habitData[todayStr]) { habitData[todayStr] = { checked: [], total: habits.length }; } 
else { habitData[todayStr].total = habits.length; }

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

// --- STATS LOGIK ---
function updateStats() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  const percent = ((now - start) / (end - start)) * 100;
  
  document.getElementById('year-percent').textContent = percent.toFixed(1) + '%';
  document.getElementById('year-label').textContent = `av ${now.getFullYear()} avklarat`;
  
  setTimeout(() => { document.getElementById('year-progress-fill').style.width = percent + '%'; }, 100);

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
      if (i === 0) continue;
      else break; 
    }
  }
  document.getElementById('streak-counter').textContent = currentStreak;
}

// --- IDÉ & PROJEKT LOGIK ---
const ideaCategories = ['drakenberg', 'ines', 'isk'];
let projectIdeas = JSON.parse(localStorage.getItem('ghost_project_ideas')) || { drakenberg: [], ines: [], isk: [] };

function saveIdeas() {
  localStorage.setItem('ghost_project_ideas', JSON.stringify(projectIdeas));
}

function renderIdeas() {
  ideaCategories.forEach(cat => {
    const list = document.getElementById(`list-${cat}`);
    list.innerHTML = '';
    projectIdeas[cat].forEach((idea, index) => {
      const item = document.createElement('div');
      item.className = 'list-item'; 
      
      const text = document.createElement('span');
      text.className = 'list-text';
      text.textContent = idea;
      
      const delBtn = document.createElement('button');
      delBtn.className = 'list-delete';
      delBtn.textContent = '×';
      delBtn.addEventListener('click', () => {
        projectIdeas[cat].splice(index, 1);
        saveIdeas();
        renderIdeas();
      });
      
      item.appendChild(text);
      item.appendChild(delBtn);
      list.appendChild(item);
    });
  });
}

function setupIdeaInputs() {
  ideaCategories.forEach(cat => {
    const btn = document.getElementById(`add-${cat}-btn`);
    const input = document.getElementById(`input-${cat}`);
    
    const addIdea = () => {
      const val = input.value.trim();
      if (val) {
        projectIdeas[cat].push(val);
        saveIdeas();
        renderIdeas();
        input.value = '';
      }
    };
    
    btn.addEventListener('click', addIdea);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addIdea();
    });
  });
}

// --- VIKT OCH HÄLSA (CHART.JS) LOGIK ---
let weightData = JSON.parse(localStorage.getItem('ghost_weight_data')) || [];
let weightChartInstance = null;

function saveWeightData() {
  localStorage.setItem('ghost_weight_data', JSON.stringify(weightData));
}

function renderWeightChart() {
  const ctx = document.getElementById('weightChart').getContext('2d');
  
  const labels = weightData.map(d => d.date);
  const data = weightData.map(d => d.weight);

  // Om grafen redan finns, ta bort den innan vi ritar om
  if (weightChartInstance) {
    weightChartInstance.destroy();
  }

  // Konfigurera färgerna för vårt Dark Mode
  Chart.defaults.color = '#8e8a86';
  Chart.defaults.font.family = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';

  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Vikt (kg)',
        data: data,
        borderColor: '#3dd68c', // Grön accentfärg
        backgroundColor: 'rgba(61, 214, 140, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#1c1a19',
        pointBorderColor: '#3dd68c',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.3 // Mjuka kurvor
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: '#2c2927' }
        },
        x: {
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false } // Gömmer legend-boxen för en cleanare look
      }
    }
  });
}

document.getElementById('add-weight-btn').addEventListener('click', addWeight);
document.getElementById('new-weight-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addWeight();
});

function addWeight() {
  const input = document.getElementById('new-weight-input');
  // Ersätter kommatecken med punkt utifall man skriver med svenskt format (ex 80,5)
  const val = parseFloat(input.value.replace(',', '.')); 
  
  if (!isNaN(val)) {
    const now = new Date();
    const dateStr = getLocalDayString(now);
    
    // Kollar om det redan finns en vikt inlagd idag, då uppdaterar vi bara den
    const existingIndex = weightData.findIndex(d => d.date === dateStr);
    if (existingIndex !== -1) {
      weightData[existingIndex].weight = val;
    } else {
      weightData.push({ date: dateStr, weight: val });
    }
    
    // Sortera efter datum ifall något blivit fel
    weightData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    saveWeightData();
    renderWeightChart();
    input.value = '';
  }
}

// --- STARTA APPEN ---
updateGreeting();
renderTodos();
initializePlanner();
renderHabits();
renderHeatmap();
updateStats();
renderIdeas();
setupIdeaInputs();
