const $createTaskBtn = document.querySelector('#createtask');
const $addTaskModal = document.querySelector('#addtaskmodal');
const $cancelAddTask = document.querySelector('#addtaskmodal > img.cancel');

const $title = document.querySelector('form input[name="title"]')
const $status = document.querySelector('form select')
const $desc = document.querySelector('form textarea')

const resetFields = () => {
    $title.value = '';
    $desc.value = '';
    $status.value = 'todo';
}

$createTaskBtn.addEventListener('click', (e) => {
  e.stopPropagation()
  $addTaskModal.style.display = 'block';
})

$cancelAddTask.addEventListener('click', (e) => {
  e.stopPropagation();
  $addTaskModal.style.display = 'none';
  resetFields();
})


class Task {
  constructor(title, status, desc) {
    this.title = title;
    this.status = status;
    this.desc = desc;
    this.elem = createElem(this.title, this.desc, this.status);
  }
}

const tasks = {
  todo: [],
  progress: [],
  done: []
};
const tasksProxy = new Proxy(tasks, {
  get(target, prop) {
    const value = target[prop];
    return value
  },
  set(obj, prop, value) {
    if (Array.isArray(value)) {
      obj[prop] = obj[prop].filter(t => value.includes(t));
    } else {
      obj[prop].push(value);
    }
    return true;
  }
})

const $addTaskForm = document.querySelector('#addtaskmodal > form');
$addTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();

  if (!$title.value || !$desc.value.trim()) {
    !$title.value ? alert('Title must not be empty') :
    !$desc.value.trim() ? alert('Description must not be empty') : ''
  } else if (titleAreadyExists($title.value, $status.value)) {
    alert('Task title already exists.')
  } else {
    const task = new Task($title.value, $status.value, $desc.value.trim())

    switch ($status.value) {
      case 'todo': tasksProxy.todo = task; break;
      case 'progress': tasksProxy.progress = task; break;
      case 'done': tasksProxy.done = task; break;
      default: tasksProxy.todo = task; break;
    }

    resetFields();

    $addTaskModal.style.display = 'none';
    iterateTasks();
    observeDraggables();
    observeDelBtns();
    observeTaskClicks();
  }
})

const titleAreadyExists = (title, status) => {
  const tasks = tasksProxy[status];
  if (tasks.length) {
    const titles = tasks.map(task => task.title)
    return titles.includes(title)
  }

  return false;
}

const createElem = (title, desc, status) => {
  const $task = document.createElement('div');
  $task.setAttribute('class', 'task');
  $task.setAttribute('draggable', true);
  $task.setAttribute('status', status);
  $task.setAttribute('title', title);

  const $titleDiv = document.createElement('div');
  $titleDiv.setAttribute('class', 'title');

  const $div = document.createElement('div');

  const $img = document.createElement('img');
  $img.setAttribute('alt', 'drag');
  $img.setAttribute('src', './assets/drag.svg');

  const $span = document.createElement('span');
  $span.setAttribute('class', 'title');
  $span.innerHTML = title;

  const $del = document.createElement('img');
  $del.setAttribute('alt', 'trash');
  $del.setAttribute('src', './assets/trash.svg');
  $del.setAttribute('title', title);
  $del.setAttribute('status', status);

  const $desc = document.createElement('div');
  $desc.setAttribute('class', 'desc');
  $desc.style.display = 'none';
  $desc.innerHTML = desc;

  $div.appendChild($img);
  $div.appendChild($span);

  $titleDiv.appendChild($div);
  $titleDiv.appendChild($del);

  $task.appendChild($titleDiv);
  $task.appendChild($desc);

  return $task 
}

const iterateTasks = () => {
  const $dropZones = document.querySelectorAll('div.dropzone');

  for (const [status, tasks] of Object.entries(tasksProxy)) {
    const $board = document.querySelector(`div.board.${status}`);
    if (tasks.length) {
      tasks.forEach(task => {
        $board.prepend(task.elem)
      })
    }
  }
}

const observeDraggables = () => {
  const $draggables = document.querySelectorAll('div[draggable]');
  $draggables.forEach($draggable => {

    $draggable.addEventListener('dragstart', (e) => {
      $draggable.classList.add('dragging');
      const title = $draggable.getAttribute('title');
      const status = $draggable.getAttribute('status')
      const data = JSON.stringify({title, status})
      e.dataTransfer.setData('text/plain', data)
    })

    $draggable.addEventListener('dragend', () => {
      $draggable.classList.remove('dragging');
    })
  })
}

const $dropZones = document.querySelectorAll('div.dropzone');

$dropZones.forEach($dropZone => {

  $dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    const $draggable = document.querySelector('div.dragging');
    $dropZone.style.filter = 'drop-shadow(0 0 5px var(--blue))'
    $dropZone.style.backgroundColor = 'rgba(100, 100, 100, 0.2)'
    $dropZone.prepend($draggable);
  })

  $dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    $dropZone.style.filter = '';
    $dropZone.style.backgroundColor = 'none'
  })

  $dropZone.addEventListener('dragend', (e) => {
    e.preventDefault();
    $dropZone.style.filter = '';
    $dropZone.style.backgroundColor = 'none'
  })

  $dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const $draggable = document.querySelector('div.dragging');
    const {title, status} = JSON.parse(e.dataTransfer.getData('text/plain'));
    const newStatus = $dropZone.classList[2];

    const sourceTasks = tasksProxy[status];
    const destinationTasks = tasksProxy[newStatus];

    const sourceTasksUpdated = sourceTasks.filter(t => t.title !== title);
    const transferedTask = sourceTasks.filter(t => t.title === title);
    const destinationTasksUpdated = [transferedTask, ...destinationTasks]

    $draggable.setAttribute('status', newStatus);
    const $delBtn = $draggable.querySelector('img[alt*="trash"]');
    $delBtn.setAttribute('status', newStatus);

    tasksProxy[status] = sourceTasksUpdated;
    tasksProxy[newStatus] = destinationTasksUpdated;

    $dropZone.style.filter = '';
    $dropZone.style.backgroundColor = 'none'
  })
})

const observeDelBtns = () => {
  const $delBtn = document.querySelectorAll('img[alt*="trash"]')
  $delBtn.forEach($btn => {
    $btn.addEventListener('mouseover', (e) => {
      e.target.src = 'assets/trash-solid.svg'
    })

    $btn.addEventListener('mouseleave', (e) => {
      e.target.src = 'assets/trash.svg'
    })

    $btn.addEventListener('click', (e) => {
      const title = e.target.getAttribute('title')
      const status = e.target.getAttribute('status')

      const tasks = tasksProxy[status];
      const updatedTasks = tasks.filter(task => task.title !== title);
      tasksProxy[status] = updatedTasks;

      const $board = document.querySelector(`div.board.${status}`)
      const $task = document.querySelector(`div.task[title=${title}]`)
      $board.removeChild($task)
    })
  })
}

const observeTaskClicks = () => {
  const $tasks = document.querySelectorAll('div.task');
  $tasks.forEach($task => {
    $task.addEventListener('click', (e) => {
      e.stopPropagation();
      const display = $task.children[1].style.display;

      display === 'block' || display === '' ?
      $task.children[1].style.display = 'none' :
      $task.children[1].style.display = 'block';
    })
  })
}

const $infoBtn = document.querySelector('img[alt="info"]');
$infoBtn.addEventListener('mouseover', (e) => {
  e.stopPropagation();
  e.target.src = 'assets/info-solid.svg'
})

$infoBtn.addEventListener('mouseleave', (e) => {
  e.stopPropagation();
  e.target.src = 'assets/info.svg'
})

$infoBtn.addEventListener('click', (e) => {
  const $info = document.querySelector('div#info');
  const display = $info.style.display;
  
  display === 'none' || display === '' ?
  $info.style.display = 'flex' :
  $info.style.display = 'none';
})

