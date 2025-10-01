import React, { useState, useEffect } from 'react'
import './App.css'  // 👈 nuevo

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [tasks, setTasks] = useState([])
  const [description, setDescription] = useState("")
  const [responsible, setResponsible] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [files, setFiles] = useState([])
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
      dueDate,
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
    setDueDate("")
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

  return (
    <div className="app-container">
      <header className="app-header">
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%'}}>
          <img src="/logo.png" alt="TaskMaster Logo" className="logo" style={{marginBottom: 8}} />
          <h1 style={{margin: 0}}>Pedido de Grafica</h1>
        </div>
      </header>

      <form className="task-form" onSubmit={(e) => { e.preventDefault(); addTask(); }}>
        <label for="description">Ingrese la descripcion de la tarea:</label>
        <input
          type="text"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descripción de la tarea"
          required
        />
        <label for="responsible">Ingrese su nombre:</label>
        <input
          type="text"
          id="responsible"
          value={responsible}
          onChange={(e) => setResponsible(e.target.value)}
          placeholder="Nombre"
        />
        <label for="date">Ingrese la fecha de vencimiento de la tarea:</label>
        <input
          type="date"
          id="date"
          value={dueDate}
          min={minDueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        <label for="notes">Ingrese comentarios adicionales:</label>
        <textarea
          value={notes}
          id="notes"
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas adicionales"
        />
        <label for="files">Ingrese archivos adjuntos (documentos o imagenes):</label>
        <input
          type="file"
          id="files"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files))}
        />

        {/* Voice recording UI */}
        <div style={{ margin: '10px 0' }}>
          <label>Grabe un mensaje de voz opcional:</label><br />
          {!recording && (
            <button type="button" onClick={startRecording} style={{marginRight: 8}}>Grabar</button>
          )}
          {recording && (
            <button type="button" onClick={stopRecording} style={{marginRight: 8}}>Detener</button>
          )}
          {audioURL && (
            <audio src={audioURL} controls style={{ verticalAlign: 'middle', marginLeft: 8 }} />
          )}
          <label>(Escuche la grabacion y verifique que sea correcta)</label><br />
        </div>

        <button type="submit">Agregar Tarea</button>
      </form>

      <ul className="task-list">
        {tasks.map(task => (
          <li key={task.id} className="task-card">
            <div>
              <strong>{task.description}</strong>
              {task.completed && <span style={{color: 'green', marginLeft: 8}}>(Completada)</span>}
              {task.canceled && <span style={{color: 'red', marginLeft: 8}}>(Cancelada)</span>}
            </div>
            {task.responsible && <div>Responsable: {task.responsible}</div>}
            {task.due_date && <div>Vence: {task.due_date}</div>}
            {task.notes && <div>Notas: {task.notes}</div>}
            {/* Show all attached files */}
            {task.files && Array.isArray(task.files) && task.files.length > 0 && (
              <div>
                <div>Archivos adjuntos:</div>
                <ul>
                  {task.files.map((url, idx) => (
                    <li key={idx}>
                      {url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img src={url} alt={`Adjunto ${idx+1}`} style={{maxWidth: 120, maxHeight: 120}} />
                      ) : url.match(/\.(mp3|wav|ogg|webm)$/i) ? (
                        <audio src={url} controls />
                      ) : (
                        <a href={url} target="_blank" rel="noopener noreferrer">Archivo {idx+1}</a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Show audio if present and not in files */}
            {task.audio && (!task.files || !task.files.includes(task.audio)) && (
              <div>
                <div>Mensaje de voz:</div>
                <audio src={task.audio} controls />
              </div>
            )}
            {!(task.completed || task.canceled) && (
              <>
                <button onClick={() => completeTask(task.id)}>Completar</button>
                <button onClick={() => cancelTask(task.id)} style={{marginLeft: 8, color: 'red'}}>Cancelar</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App
