import React, { useState, useEffect } from 'react'
import './App.css'  // 👈 nuevo

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [tasks, setTasks] = useState([])
  const [description, setDescription] = useState("")
  const [responsible, setResponsible] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [image, setImage] = useState(null)
  // Calculate min date (today + 2 days)
  const minDueDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
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

    let imageUrl = null;
    if (image) {
      imageUrl = await uploadFile(image);
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
      dueDate,
      notes,
      completed: false,
      image: imageUrl,
      audio: audioUrl
    }

    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    })

    setDescription("")
    setResponsible("")
    setDueDate("")
    setNotes("")
    setImage(null)
    setAudioBlob(null)
    setAudioURL(null)

    fetchTasks()
  }

  const completeTask = async (id) => {
    await fetch(`${API_URL}/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true })
    })
    fetchTasks()
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <img src="/logo.png" alt="TaskMaster Logo" className="logo" />
        <h1>Tareas para Natasha</h1>
      </header>

      <form className="task-form" onSubmit={(e) => { e.preventDefault(); addTask(); }}>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción de la tarea"
          required
        />
        <input
          type="text"
          value={responsible}
          onChange={(e) => setResponsible(e.target.value)}
          placeholder="Responsable"
        />
        <input
          type="date"
          value={dueDate}
          min={minDueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales"
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        {/* Voice recording UI */}
        <div style={{ margin: '10px 0' }}>
          <label>Mensaje de voz:</label><br />
          {!recording && (
            <button type="button" onClick={startRecording} style={{marginRight: 8}}>Grabar</button>
          )}
          {recording && (
            <button type="button" onClick={stopRecording} style={{marginRight: 8}}>Detener</button>
          )}
          {audioURL && (
            <audio src={audioURL} controls style={{ verticalAlign: 'middle', marginLeft: 8 }} />
          )}
        </div>

        <button type="submit">Agregar</button>
      </form>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-card">
            <div>
              <strong>{task.description}</strong>
            </div>
            {task.responsible && <div>Responsable: {task.responsible}</div>}
            {task.due_date && <div>Vence: {task.due_date}</div>}
            {task.notes && <div>Notas: {task.notes}</div>}
            {task.image && (
              <div>
                <img src={task.image} alt="Adjunto" />
              </div>
            )}
            {!task.completed && (
              <button onClick={() => completeTask(task.id)}>Completar</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
