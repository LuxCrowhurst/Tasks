// Initialize Lucide icons
lucide.createIcons();

// App state
let appData = {
  setupComplete: false,
  challengeStarted: false,
  challengeStartDate: null,
  daysCompleted: 0,
  parentPassword: "1987",
  todayTasks: [
    { id: 1, text: "Put away clothes after changing or place in the wash", completed: false },
    { id: 2, text: "Make bed in the morning", completed: false },
    { id: 3, text: "Dont leave makeup and other things laying around", completed: false }
  ],
  customTasks: [],
  dailyLogs: []
};

let activeSection = "dashboard";
let showAddTask = false;
let newTaskText = "";
let showPasswordModal = false;
let passwordError = false;
let passwordAction = null;
let parentPasswordInput = "";

// DOM Elements
const contentArea = document.getElementById('content-area');
const modalContainer = document.getElementById('modal-container');
const tabDashboard = document.getElementById('tab-dashboard');
const tabTasks = document.getElementById('tab-tasks');
const tabHistory = document.getElementById('tab-history');

// Load data from localStorage
function loadData() {
  try {
    const savedData = localStorage.getItem('roomQuestData');
    if (savedData) {
      appData = JSON.parse(savedData);
    }
  } catch (error) {
    console.error("Error loading saved data:", error);
  }
}

// Save data to localStorage
function saveData() {
  try {
    localStorage.setItem('roomQuestData', JSON.stringify(appData));
  } catch (error) {
    console.error("Error saving data:", error);
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Calculate days remaining in the challenge
function getDaysRemaining() {
  return appData.challengeStarted ? 7 - Math.min(7, appData.daysCompleted) : 7;
}

// Set up navigation tabs
function setupTabs() {
  tabDashboard.addEventListener('click', () => {
    setActiveSection('dashboard');
  });
  
  tabTasks.addEventListener('click', () => {
    setActiveSection('tasks');
  });
  
  tabHistory.addEventListener('click', () => {
    setActiveSection('history');
  });
}

// Set active section and update UI
function setActiveSection(section) {
  activeSection = section;
  
  // Update tab styles
  const tabs = [tabDashboard, tabTasks, tabHistory];
  const sections = ['dashboard', 'tasks', 'history'];
  
  tabs.forEach((tab, index) => {
    if (sections[index] === activeSection) {
      tab.className = 'flex-1 py-3 font-medium text-sm text-blue-600 border-b-2 border-blue-600';
    } else {
      tab.className = 'flex-1 py-3 font-medium text-sm text-gray-500';
    }
  });
  
  // Render content
  renderContent();
}

// Complete room setup
function completeRoomSetup() {
  passwordAction = 'completeSetup';
  showPasswordModal = true;
  renderModal();
}

// Start the 7-day challenge
function startChallenge() {
  passwordAction = 'startChallenge';
  showPasswordModal = true;
  renderModal();
}

// Complete today's tasks
function completeDay() {
  // Check if all tasks are completed
  const allTasksCompleted = [...appData.todayTasks, ...appData.customTasks].every(task => task.completed);
  
  if (!allTasksCompleted) {
    alert("Complete all tasks before marking the day as complete!");
    return;
  }
  
  passwordAction = 'completeDay';
  showPasswordModal = true;
  renderModal();
}

// Reset the challenge
function resetChallenge() {
  if (confirm("Are you sure you want to reset the entire challenge? This will clear all your progress.")) {
    appData.setupComplete = false;
    appData.challengeStarted = false;
    appData.challengeStartDate = null;
    appData.daysCompleted = 0;
    appData.todayTasks = appData.todayTasks.map(task => ({...task, completed: false}));
    appData.dailyLogs = [];
    saveData();
    renderContent();
  }
}

// Toggle task completion
function toggleTask(id, isCustom = false) {
  if (isCustom) {
    appData.customTasks = appData.customTasks.map(task => 
      task.id === id ? {...task, completed: !task.completed} : task
    );
  } else {
    appData.todayTasks = appData.todayTasks.map(task => 
      task.id === id ? {...task, completed: !task.completed} : task
    );
  }
  saveData();
  renderContent();
}

// Delete a custom task
function deleteCustomTask(id) {
  appData.customTasks = appData.customTasks.filter(task => task.id !== id);
  saveData();
  renderContent();
}

// Toggle add task form
function toggleAddTaskForm() {
  showAddTask = !showAddTask;
  renderContent();
}

// Add a new custom task
function addCustomTask() {
  const input = document.getElementById('new-task-input');
  if (input) {
    newTaskText = input.value;
  }
  
  if (newTaskText.trim() === "") return;
  
  const newTask = {
    id: Date.now(),
    text: newTaskText,
    completed: false
  };
  
  appData.customTasks.push(newTask);
  saveData();
  
  newTaskText = "";
  showAddTask = false;
  renderContent();
}

// Check parent password
function checkPassword() {
  const passwordInput = document.getElementById('parent-password');
  if (passwordInput) {
    parentPasswordInput = passwordInput.value;
  }
  
  if (parentPasswordInput === appData.parentPassword) {
    passwordError = false;
    showPasswordModal = false;
    
    // Perform the action based on what was requested
    if (passwordAction === 'completeSetup') {
      appData.setupComplete = true;
    } else if (passwordAction === 'startChallenge') {
      const today = new Date().toISOString();
      appData.challengeStarted = true;
      appData.challengeStartDate = today;
      appData.daysCompleted = 0;
      appData.dailyLogs = [];
    } else if (passwordAction === 'completeDay') {
      // Create a log entry for today
      const today = new Date().toISOString();
      const newLog = {
        date: today,
        dayNumber: appData.daysCompleted + 1,
        tasks: [...appData.todayTasks, ...appData.customTasks].map(task => ({
          text: task.text,
          completed: task.completed
        }))
      };
      
      // Update state
      appData.daysCompleted = Math.min(7, appData.daysCompleted + 1);
      appData.todayTasks = appData.todayTasks.map(task => ({...task, completed: false}));
      appData.customTasks = appData.customTasks.map(task => ({...task, completed: false}));
      appData.dailyLogs.push(newLog);
    }
    
    saveData();
    parentPasswordInput = "";
    renderContent();
    renderModal();
  } else {
    passwordError = true;
    renderModal();
  }
}

// Close the modal
function closeModal() {
  showPasswordModal = false;
  passwordError = false;
  parentPasswordInput = "";
  renderModal();
}

// Render the password modal
function renderModal() {
  if (!showPasswordModal) {
    modalContainer.classList.add('hidden');
    modalContainer.classList.remove('flex');
    return;
  }
  
  modalContainer.classList.remove('hidden');
  modalContainer.classList.add('flex');
  
  let actionText = '';
  if (passwordAction === 'completeSetup') {
    actionText = "Please enter parent password to confirm the initial room setup is complete.";
  } else if (passwordAction === 'startChallenge') {
    actionText = "Please enter parent password to start the 7-day challenge.";
  } else if (passwordAction === 'completeDay') {
    actionText = "Please enter parent password to verify today's tasks are complete.";
  }
  
  modalContainer.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h3 class="text-xl font-bold text-gray-800 mb-4">Parent Verification</h3>
      <p class="text-gray-600 mb-6">${actionText}</p>
      
      <div class="mb-4">
        <input
          type="password"
          id="parent-password"
          class="w-full border-2 ${passwordError ? 'border-red-300' : 'border-gray-300'} rounded-md px-4 py-3 text-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder="Enter password"
          value="${parentPasswordInput}"
        />
        ${passwordError ? '<p class="text-red-500 text-sm mt-1">Incorrect password. Please try again.</p>' : ''}
      </div>
      
      <div class="flex justify-end space-x-3">
        <button
          class="px-4 py-2 text-gray-600 font-medium rounded-md hover:bg-gray-100"
          onclick="closeModal()"
        >
          Cancel
        </button>
        <button
          class="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
          onclick="checkPassword()"
        >
          Verify
        </button>
      </div>
    </div>
  `;
  
  // Add event listener for the password input
  const passwordInput = document.getElementById('parent-password');
  passwordInput.addEventListener('input', (e) => {
    parentPasswordInput = e.target.value;
    passwordError = false;
  });
  
  // Add event listener for Enter key
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      checkPassword();
    }
  });
}

// Render the dashboard section
function renderDashboard() {
  let html = '<div class="space-y-4">';
  
  // Initial Room Setup Card
  if (!appData.setupComplete) {
    html += `
      <div class="bg-white rounded-lg shadow-lg p-5 border-l-4 border-pink-500 animate-pulse">
        <h2 class="text-xl font-bold mb-3 text-pink-600">Step 1: Initial Room Setup</h2>
        <div class="bg-pink-50 p-4 rounded-md mb-4">
          <p class="text-pink-700 font-medium mb-2">
            <strong>REQUIRED:</strong> Before the 7-day challenge can begin:
          </p>
          <ul class="space-y-2 text-gray-700">
            <li class="flex items-center">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold mr-2">✓</span>
              <strong>Place all belongings away in the bedroom</strong>
            </li>
            <li class="flex items-center">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold mr-2">✓</span>
              Sort all belongings in the shared room
            </li>
            <li class="flex items-center">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold mr-2">✓</span>
              Make your area nice and tidy
            </li>
            <li class="flex items-center">
              <span class="flex-shrink-0 w-5 h-5 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center text-xs font-bold mr-2">✓</span>
              Put away all items in their proper places
            </li>
          </ul>
        </div>
        <p class="text-gray-600 mb-4">
          <strong class="text-pink-700">Important:</strong> All belongings must be properly stored in the bedroom before proceeding. Once everything is tidied up and organized, a parent will verify and mark this step as complete.
        </p>
        <button 
          class="bg-gradient-to-r from-pink-500 to-pink-600 w-full text-white py-3 px-6 rounded-md font-bold hover:from-pink-600 hover:to-pink-700 shadow-md transform hover:scale-105 transition-all"
          onclick="completeRoomSetup()"
        >
          Mark Room Setup Complete
        </button>
      </div>
    `;
  }
  
  // Progress Card
  if (appData.setupComplete) {
    html += `
      <div class="bg-white rounded-lg shadow-lg p-5 border-l-4 border-blue-500">
        <h2 class="text-xl font-bold mb-3 text-blue-600">Challenge Progress</h2>
    `;
    
    if (appData.challengeStarted) {
      const daysRemaining = getDaysRemaining();
      html += `
        <div class="flex justify-between items-center mb-4">
          <span class="text-gray-600 flex items-center bg-blue-50 px-3 py-1 rounded-md">
            <i data-lucide="calendar" class="w-4 h-4 mr-2 text-blue-500"></i>
            Started: ${formatDate(appData.challengeStartDate)}
          </span>
          <span class="text-gray-600 flex items-center bg-blue-50 px-3 py-1 rounded-md">
            <i data-lucide="clock" class="w-4 h-4 mr-2 text-blue-500"></i>
            Days left: ${daysRemaining}
          </span>
        </div>
        
        <div class="h-6 bg-gray-200 rounded-full overflow-hidden mb-3 shadow-inner">
          <div 
            class="h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-xs text-white font-bold" 
            style="width: ${(appData.daysCompleted / 7) * 100}%"
          >
            ${Math.round((appData.daysCompleted / 7) * 100)}%
          </div>
        </div>
        
        <div class="text-center">
          <p class="font-bold text-blue-800 text-lg">
            ${appData.daysCompleted}/7 days completed
          </p>
      `;
      
      if (appData.daysCompleted >= 7) {
        html += `
          <div class="mt-6 p-6 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-300 rounded-lg shadow-lg animate-pulse">
            <div class="flex justify-center mb-3">
              <i data-lucide="award" class="w-12 h-12 text-purple-600"></i>
            </div>
            <p class="font-bold text-purple-800 text-xl mb-2">
              Congratulations! You've successfully completed the 7-day challenge!
            </p>
            <p class="text-purple-700">
              You've earned your own room by showing responsibility and organization!
            </p>
          </div>
        `;
      } else {
        html += `
          <button 
            class="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-md font-bold hover:from-blue-600 hover:to-purple-700 shadow-md transform hover:scale-105 transition-all"
            onclick="completeDay()"
          >
            Complete Today's Tasks
          </button>
        `;
      }
      
      html += `
        </div>
      `;
    } else {
      html += `
        <div class="text-center py-6">
          <i data-lucide="home" class="w-16 h-16 mx-auto text-blue-500 mb-4"></i>
          <p class="text-gray-700 text-lg mb-4">
            Room setup is complete! Ready to start the 7-day challenge?
          </p>
          <p class="text-gray-600 mb-6">
            Once you press start, you'll need to complete 7 days of keeping your area tidy to earn your own room!
          </p>
          <button 
            class="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-8 rounded-md font-bold hover:from-blue-600 hover:to-purple-700 shadow-md transform hover:scale-105 transition-all"
            onclick="startChallenge()"
          >
            Start 7-Day Challenge
          </button>
        </div>
      `;
    }
    
    html += `
      </div>
    `;
  }
  
  // Rules Card
  html += `
    <div class="bg-white rounded-lg shadow-lg p-5 border-l-4 border-purple-500">
      <h2 class="text-xl font-bold mb-3 text-purple-600">Room Challenge Rules</h2>
      
      <div class="space-y-4">
        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="flex">
            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold mr-3">1</span>
            <p class="text-gray-800 font-medium">Look after your belongings by putting them away once finished or when an expected period of time is likely to pass.</p>
          </div>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="flex">
            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold mr-3">2</span>
            <p class="text-gray-800 font-medium">Don't leave anything laying around, dirty clothes, towels, makeup, etc.</p>
          </div>
        </div>
        
        <div class="bg-purple-50 p-4 rounded-lg">
          <div class="flex">
            <span class="flex-shrink-0 w-8 h-8 rounded-full bg-purple-200 text-purple-800 flex items-center justify-center font-bold mr-3">3</span>
            <p class="text-gray-800 font-medium">While looking good is important, you must prioritize more important things than makeup when required.</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  html += '</div>';
  return html;
}

// Render the tasks section
function renderTasks() {
  let html = '<div class="space-y-4">';
  
  // Daily Tasks
  html += `
    <div class="bg-white rounded-lg shadow-lg p-5 border-l-4 border-green-500">
      <h2 class="text-xl font-bold mb-4 text-green-600">Daily Tasks</h2>
      <div class="space-y-3">
  `;
  
  appData.todayTasks.forEach(task => {
    html += `
      <div 
        class="flex items-center p-3 rounded-lg border transition-all ${task.completed ? 'bg-green-50 border-green-200' : 'border-gray-200 hover:border-green-200'}"
      >
        <div 
          class="flex-shrink-0 w-6 h-6 rounded-md border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} mr-3 cursor-pointer shadow-sm flex items-center justify-center"
          onclick="toggleTask(${task.id})"
        >
          ${task.completed ? '<i data-lucide="check-square" class="w-5 h-5 text-white"></i>' : ''}
        </div>
        <span class="${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}">
          ${task.text}
        </span>
      </div>
    `;
  });
  
  html += `
      </div>
    </div>
  `;
  
  // Custom Tasks
  html += `
    <div class="bg-white rounded-lg shadow-lg p-5 border-l-4 border-orange-500">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-orange-600">Custom Tasks</h2>
        <button 
          class="text-orange-600 flex items-center text-sm font-medium bg-orange-50 px-3 py-2 rounded-md hover:bg-orange-100 transition-colors"
          onclick="toggleAddTaskForm()"
        >
          ${showAddTask ? 
            '<i data-lucide="chevron-up" class="w-4 h-4 mr-1"></i> Hide' : 
            '<i data-lucide="plus" class="w-4 h-4 mr-1"></i> Add Task'}
        </button>
      </div>
  `;
  
  if (showAddTask) {
    html += `
      <div class="flex mb-4">
        <input
          type="text"
          id="new-task-input"
          class="flex-grow border-2 border-orange-200 rounded-l-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          placeholder="Enter your task..."
          value="${newTaskText}"
        />
        <button
          class="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-r-md text-sm font-bold hover:from-orange-600 hover:to-orange-700 shadow"
          onclick="addCustomTask()"
        >
          Add
        </button>
      </div>
    `;
  }
  
  html += `<div class="space-y-3">`;
  
  if (appData.customTasks.length === 0) {
    html += `
      <div class="text-center py-4 bg-orange-50 rounded-lg">
        <p class="text-orange-600 font-medium">No custom tasks yet. Add some to track additional responsibilities!</p>
      </div>
    `;
  } else {
    appData.customTasks.forEach(task => {
      html += `
        <div 
          class="flex items-center p-3 rounded-lg border transition-all ${task.completed ? 'bg-orange-50 border-orange-200' : 'border-gray-200 hover:border-orange-200'}"
        >
          <div 
            class="flex-shrink-0 w-6 h-6 rounded-md border-2 ${task.completed ? 'bg-orange-500 border-orange-500' : 'border-gray-300'} mr-3 cursor-pointer shadow-sm flex items-center justify-center"
            onclick="toggleTask(${task.id}, true)"
          >
            ${task.completed ? '<i data-lucide="check-square" class="w-5 h-5 text-white"></i>' : ''}
          </div>
          <span class="${task.completed ? 'line-through text-gray-400' : 'text-gray-700 font-medium'} flex-grow">
            ${task.text}
          </span>
          <button 
            class="text-gray-400 hover:text-red-500 p-1"
            onclick="deleteCustomTask(${task.id})"
          >
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </div>
      `;
    });
  }
  
  html += `
      </div>
    </div>
  </div>
  `;
  
  return html;
}

// Render the history section
function renderHistory() {
  let html = '<div class="space-y-4">';
  
  html += `
    <div class="bg-white rounded-lg shadow-lg p-5 border-l-4 border-indigo-500">
      <h2 class="text-xl font-bold mb-3 text-indigo-600">Challenge History</h2>
  `;
  
  if (appData.dailyLogs.length === 0) {
    html += `
      <div class="text-center py-8 bg-indigo-50 rounded-lg">
        <i data-lucide="calendar" class="w-16 h-16 mx-auto text-indigo-400 mb-3"></i>
        <p class="text-indigo-600 font-medium mb-2">No history recorded yet.</p>
        <p class="text-indigo-500 text-sm">Complete days to track your progress.</p>
      </div>
    `;
  } else {
    html += `<div class="space-y-4">`;
    
    appData.dailyLogs.forEach((log, index) => {
      html += `
        <div class="border-2 border-indigo-100 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div class="flex justify-between items-center mb-3">
            <span class="font-bold text-indigo-600 text-lg bg-indigo-50 px-3 py-1 rounded-md">Day ${log.dayNumber}</span>
            <span class="text-sm text-indigo-500 bg-indigo-50 px-3 py-1 rounded-md">${formatDate(log.date)}</span>
          </div>
          <div class="space-y-2 bg-gray-50 p-3 rounded-md">
      `;
      
      log.tasks.forEach((task, taskIndex) => {
        html += `
          <div class="flex items-center text-sm p-1">
            <div class="w-4 h-4 rounded-full ${task.completed ? 'bg-green-500' : 'bg-red-500'} mr-3"></div>
            <span class="text-gray-700">${task.text}</span>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }
  
  html += `
    </div>
    
    <div class="text-center mt-6">
      <button 
        class="text-red-600 flex items-center justify-center mx-auto text-sm bg-red-50 px-4 py-2 rounded-md hover:bg-red-100 transition-colors"
        onclick="resetChallenge()"
      >
        <i data-lucide="refresh-cw" class="w-4 h-4 mr-2"></i>
        Reset Challenge
      </button>
    </div>
  `;
  
  html += '</div>';
  return html;
}

// Render the main content based on active section
function renderContent() {
  let contentHtml = '';
  
  if (activeSection === 'dashboard') {
    contentHtml = renderDashboard();
  } else if (activeSection === 'tasks') {
    contentHtml = renderTasks();
  } else if (activeSection === 'history') {
    contentHtml = renderHistory();
  }
  
  contentArea.innerHTML = contentHtml;
  
  // After updating the DOM, add event listeners for the new task input
  if (activeSection === 'tasks' && showAddTask) {
    const newTaskInput = document.getElementById('new-task-input');
    if (newTaskInput) {
      newTaskInput.addEventListener('input', (e) => {
        newTaskText = e.target.value;
      });
      
      newTaskInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          addCustomTask();
        }
      });
      
      // Focus the input
      newTaskInput.focus();
    }
  }
  
  // Update icons
  lucide.createIcons();
}

// Initialize the application
function init() {
  loadData();
  setupTabs();
  renderContent();
  renderModal();
}

// Start the application
document.addEventListener('DOMContentLoaded', init);