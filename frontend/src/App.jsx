import React, { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL

function App() {
  const [tasks, setTasks] = useState([])
  const [description, setDescription] = useState("")
  const [responsible, setResponsible] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [image, setImage] = useState(null)

  const fetchTasks = async () => {
    const res = await fetch(`${API_URL}/tasks`)
    const data = await res.json()
    setTasks(data)
  }
  const uploadImage = async (file) => {
    // pedir pre-signed URL al backend
    const res = await fetch(`${API_URL}/upload-url?filename=${encodeURIComponent(file.name)}`)
    const { uploadUrl, fileUrl } = await res.json()

    // subir archivo a S3
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file
    })

    return fileUrl // devolver URL pública para DynamoDB
  }  


const addTask = async () => {
    if (!description) return

    let imageUrl = null
    if (image) {
      imageUrl = await uploadImage(image)
    }

    // armar payload con metadata
    const taskData = {
      description,
      responsible,
      dueDate,
      notes,
      completed: false,
      image: imageUrl
    }

    await fetch(`${API_URL}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(taskData)
    })

    // limpiar formulario
    setDescription("")
    setResponsible("")
    setDueDate("")
    setNotes("")
    setImage(null)

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
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>Tareas para Natasha</h1>
      <form onSubmit={(e) => { e.preventDefault(); addTask(); }}>
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
        <button type="submit">Agregar</button>
      </form>
      <ul>
        {tasks.map(task => (
          <li key={task.id} style={{ marginBottom: "10px" }}>
            <div>
              <strong>{task.description}</strong>
            </div>
            {task.responsible && <div>Responsable: {task.responsible}</div>}
            {task.due_date && <div>Vence: {task.due_date}</div>}
            {task.notes && <div>Notas: {task.notes}</div>}
            {task.image && (
              <div>
                <img src={task.image} alt="Adjunto" style={{ maxWidth: "150px", marginTop: "5px" }} />
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
