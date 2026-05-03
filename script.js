// --- VECKOPLANERARE LOGIK ---
const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const container = document.getElementById('planner-container');

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
    container.appendChild(block);
  });
}

// --- HABIT TRACKER & HEATMAP LOGIK ---
let habits = JSON.parse(localStorage.getItem('ghost_habits')) || ['Träning', 'Läsa 30 min'];
let habitData = JSON.parse(localStorage.getItem('ghost_habit_data')) || {};

// Få dagens datum i formatet YYYY-MM-DD anpassat till lokal tidzon
function getLocalDayString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const todayStr = getLocalDayString(new Date());

// Se till att dagens data finns
if (!habitData[todayStr]) {
  habitData[todayStr] = { checked: [], total: habits.length };
} else {
  // Uppdatera totalen om vi lagt till/tagit bort habits
  habitData[todayStr].total = habits.length; 
}

function saveHabitData() {
  localStorage.setItem('ghost_habits', JSON.stringify(habits));
  localStorage.setItem('ghost_habit_data', JSON.stringify(habitData));
  renderHeatmap();
}

// Rendera habit listan för DAGEN
function renderHabits() {
  const list = document.getElementById('habit-list');
  list.innerHTML = '';
  
  habits.forEach((habit, index) => {
    const item = document.createElement('div');
    item.className = 'habit-item';
    
    const isChecked = habitData[todayStr].checked.includes(habit);
    if(isChecked) item.classList.add('checked');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'habit-checkbox';
    checkbox.checked = isChecked;
    
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!habitData[todayStr].checked.includes(habit)) {
          habitData[todayStr].checked.push(habit);
        }
        item.classList.add('checked');
      } else {
        habitData[todayStr].checked = habitData[todayStr].checked.filter(h => h !== habit);
        item.classList.remove('checked');
      }
      saveHabitData();
    });
    
    const text = document.createElement('span');
    text.className = 'habit-text';
    text.textContent = habit;
    
    const delBtn = document.createElement('button');
    delBtn.className = 'habit-delete';
    delBtn.textContent = '×';
    delBtn.addEventListener('click', () => {
      // Ta bort från listan och spara om
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

// Hantera input för nya habits
document.getElementById('add-habit-btn').addEventListener('click', () => {
  addHabit();
});

document.getElementById('new-habit-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addHabit();
});

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

// Rendera Heatmapen
function renderHeatmap() {
  const heatmap = document.getElementById('heatmap');
  heatmap.innerHTML = '';
  
  const numDays = 364; // Visar ungefär ett års data
  const today = new Date();
  
  // Justera så att första dagen i grid-systemet matchar rätt veckodag (måndag i toppen)
  const firstDate = new Date(today);
  firstDate.setDate(today.getDate() - numDays);
  let startDay = firstDate.getDay(); 
  startDay = startDay === 0 ? 6 : startDay - 1; // 0 = Mån, 6 = Sön
  
  // Lägg till tomma "padding"-block i början för att veckodagarna ska hamna rätt på raderna
  for(let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'heatmap-cell empty';
    empty.style.backgroundColor = 'transparent';
    heatmap.appendChild(empty);
  }

  // Generera celler för de senaste 365 dagarna (vänster till höger, uppifrån och ner)
  for (let i = numDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDayString(d);
    
    const cell = document.createElement('div');
    cell.className = 'heatmap-cell';
    cell.title = dateStr; // Ger tooltip med datum om man håller musen över
    
    const data = habitData[dateStr];
    if (data && data.total > 0) {
      const percentage = data.checked.length / data.total;
      
      // Bestäm nyansen av grönt beroende på procent
      if (percentage > 0) {
        if (percentage <= 0.25) cell.classList.add('color-1');
        else if (percentage <= 0.5) cell.classList.add('color-2');
        else if (percentage <= 0.75) cell.classList.add('color-3');
        else cell.classList.add('color-4');
      }
    }
    heatmap.appendChild(cell);
  }

  // Scrolla automatiskt längst till höger för att visa "idag"
  const wrapper = document.querySelector('.heatmap-wrapper');
  wrapper.scrollLeft = wrapper.scrollWidth;
}

// Starta allting när sidan laddas
initializePlanner();
renderHabits();
renderHeatmap();
