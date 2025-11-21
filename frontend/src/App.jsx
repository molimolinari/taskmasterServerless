import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './App.css'  // 👈 nuevo

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [tasks, setTasks] = useState([])
  const [description, setDescription] = useState("")
  const [responsible, setResponsible] = useState("")
  const [dueDate, setDueDate] = useState(null)
  const [notes, setNotes] = useState("")
  const [files, setFiles] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  // Calculate min date (today + 2 days)
  const minDueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  })();

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  // Start recording
  const startRecording = async () => {
    if (!navigator.mediaDevices) {
      alert('La grabación de audio no es compatible con este navegador.');
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new window.MediaRecorder(stream);
    let chunks = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setAudioBlob(blob);
      setAudioURL(URL.createObjectURL(blob));
      chunks = [];
    };
    recorder.start();
    setMediaRecorder(recorder);
    setRecording(true);
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setRecording(false);
    }
  };

  const fetchTasks = async () => {
    const res = await fetch(`${API_URL}/tasks`)
    const data = await res.json()
    setTasks(data)
  }

  // General file upload (image, audio, etc)
  const uploadFile = async (file) => {
    const fileType = file.type || 'application/octet-stream';
    const res = await fetch(`${API_URL}/upload-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(fileType)}`);
    const { uploadUrl, fileUrl } = await res.json();

    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": fileType },
      body: file
    });

    return fileUrl;
  }

  const addTask = async () => {
    if (!description) return

    let fileUrls = [];
    if (files && files.length > 0) {
      for (let file of files) {
        const url = await uploadFile(file);
        fileUrls.push(url);
      }
    }

    // Upload audio if present
    let audioUrl = null;
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice-message-${Date.now()}.webm`, { type: 'audio/webm' });
      audioUrl = await uploadFile(audioFile);
    }

    const taskData = {
      description,
      responsible,
      dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
      notes,
      completed: false,
      files: fileUrls,
      audio: audioUrl
    }

    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    })

    setDescription("")
    setResponsible("")
    setDueDate(null)
    setNotes("")
  setFiles([])
    setAudioBlob(null)
    setAudioURL(null)

    fetchTasks()
  }

  const completeTask = async (id) => {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true })
    });
    fetchTasks();
  };

  const cancelTask = async (id) => {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ canceled: true })
    });
    fetchTasks();
  };

  useEffect(() => {
    fetchTasks()
  }, [])

  // Calculate task stats
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const canceledTasks = tasks.filter(t => t.canceled).length
  const inProgressTasks = tasks.filter(t => !t.completed && !t.canceled).length

  // Filter tasks based on active filter
  const filteredTasks = tasks.filter(task => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'completed') return task.completed
    if (activeFilter === 'in-progress') return !task.completed && !task.canceled
    if (activeFilter === 'canceled') return task.canceled
    return true
  })

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <img src="/logo.png" alt="Logo" className="sidebar-logo" />
          <h2 className="sidebar-title">Resumen de pedidos</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            onClick={() => setActiveFilter('all')} 
            className={`nav-item ${activeFilter === 'all' ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => setActiveFilter('completed')} 
            className={`nav-item ${activeFilter === 'completed' ? 'active' : ''}`}
          >
            <span className="nav-icon">✅</span>
            <span>Completadas</span>
          </button>
          <button 
            onClick={() => setActiveFilter('in-progress')} 
            className={`nav-item ${activeFilter === 'in-progress' ? 'active' : ''}`}
          >
            <span className="nav-icon">⏳</span>
            <span>En progreso</span>
          </button>
          <button 
            onClick={() => setActiveFilter('canceled')} 
            className={`nav-item ${activeFilter === 'canceled' ? 'active' : ''}`}
          >
            <span className="nav-icon">❌</span>
            <span>Canceladas</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Pedido de Gráfica</h1>
            <p className="page-subtitle">Gestiona tus pedidos de diseño gráfico</p>
          </div>
          <button className="btn-new-task" onClick={() => setShowModal(true)}>
            + Nueva Tarea
          </button>
        </header>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <p className="stat-label">Total</p>
              <p className="stat-value">{totalTasks}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <p className="stat-label">En progreso</p>
              <p className="stat-value">{inProgressTasks}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <p className="stat-label">Completadas</p>
              <p className="stat-value">{completedTasks}</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">❌</div>
            <div className="stat-content">
              <p className="stat-label">Canceladas</p>
              <p className="stat-value">{canceledTasks}</p>
            </div>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="tasks-section">
          <h2 className="section-title">
            {activeFilter === 'all' && 'Todas las tareas'}
            {activeFilter === 'completed' && 'Tareas completadas'}
            {activeFilter === 'in-progress' && 'Tareas en progreso'}
            {activeFilter === 'canceled' && 'Tareas canceladas'}
          </h2>
          <div className="tasks-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                {activeFilter === 'all' && 'No hay tareas creadas aún'}
                {activeFilter === 'completed' && 'No hay tareas completadas'}
                {activeFilter === 'in-progress' && 'No hay tareas en progreso'}
                {activeFilter === 'canceled' && 'No hay tareas canceladas'}
              </div>
            ) : (
              filteredTasks.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-header">
                    <strong className="task-description">{task.description}</strong>
                    {task.completed && <span className="badge badge-success">Completada</span>}
                    {task.canceled && <span className="badge badge-danger">Cancelada</span>}
                    {!task.completed && !task.canceled && <span className="badge badge-warning">En progreso</span>}
                  </div>
                  {task.responsible && <div className="task-detail">👤 {task.responsible}</div>}
                  {task.due_date && <div className="task-detail">📅 Vence: {task.due_date}</div>}
                  {task.notes && <div className="task-detail">📝 {task.notes}</div>}
                  {task.files && Array.isArray(task.files) && task.files.length > 0 && (
                    <div className="task-files">
                      {task.files.map((url, idx) => (
                        <span key={idx}>📎 Archivo {idx + 1}</span>
                      ))}
                    </div>
                  )}
                  {!(task.completed || task.canceled) && (
                    <div className="task-actions">
                      <button onClick={() => completeTask(task.id)} className="btn-complete">Completar</button>
                      <button onClick={() => cancelTask(task.id)} className="btn-cancel">Cancelar</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Tarea</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form className="task-form-modal" onSubmit={(e) => { e.preventDefault(); addTask(); setShowModal(false); }}>
              <label htmlFor="description">Descripción de la tarea:</label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la tarea"
                required
              />
              <label htmlFor="responsible">Solicitado por:</label>
              <input
                type="text"
                id="responsible"
                value={responsible}
                onChange={(e) => setResponsible(e.target.value)}
                placeholder="Tu nombre"
              />
              <label htmlFor="date">Fecha de vencimiento:</label>
              <DatePicker
                id="date"
                selected={dueDate}
                onChange={(date) => setDueDate(date)}
                minDate={minDueDate}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona una fecha"
                className="date-picker-input"
              />
              <label htmlFor="notes">Comentarios adicionales:</label>
              <textarea
                value={notes}
                id="notes"
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notas adicionales"
              />
              <label htmlFor="files">Archivos adjuntos:</label>
              <input
                type="file"
                id="files"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files))}
              />

              {/* Voice recording UI */}
              <div style={{ margin: '10px 0' }}>
                <label>Mensaje de voz (opcional):</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {!recording && (
                    <button type="button" onClick={startRecording} className="record-button">Grabar</button>
                  )}
                  {recording && (
                    <button type="button" onClick={stopRecording} className="record-button">Detener</button>
                  )}
                  {audioURL && (
                    <audio src={audioURL} controls style={{ flex: '1', minWidth: '200px' }} />
                  )}
                </div>
                {audioURL && (
                  <label style={{ color: '#718096', fontSize: '14px', fontWeight: 400, marginTop: '4px' }}>(Escuche la grabacion y verifique que sea correcta)</label>
                )}
              </div>

              <button type="submit">Agregar Tarea</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
