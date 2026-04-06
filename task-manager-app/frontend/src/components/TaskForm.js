import { useState, useEffect } from "react";
import axios from "../api/axios";

export default function TaskForm({ refresh, editTask, setEditTask }) {

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [status, setStatus] = useState("todo");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setPriority(editTask.priority || "medium");
      setStatus(editTask.status || "todo");
      if (editTask.dueDate) {
        const d = new Date(editTask.dueDate);
        const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
        setDueDate(local.toISOString().substring(0, 16));
      } else {
        setDueDate("");
      }
    }
  }, [editTask]);

  const submit = async (e) => {
    e.preventDefault();

    const data = {
      title,
      description,
      priority,
      status,
      ...(dueDate && { dueDate: new Date(dueDate).toISOString() }),
    };


    if (editTask) {
      await axios.put(`/tasks/${editTask._id}`, data);
      setEditTask(null);
    } else {
      await axios.post("/tasks", data);
    }

    setTitle("");
    setDescription("");
    setPriority("medium");
    setStatus("todo");
    setDueDate("");

    refresh();
  };

  return (
    <form onSubmit={submit} className="bg-white p-5 shadow rounded mb-6 space-y-3">

      <h2 className="text-lg font-semibold">
        {editTask ? "Update Task" : "Create Task"}
      </h2>

      <input
        value={title}
        onChange={(e)=>setTitle(e.target.value)}
        placeholder="Task Title"
        className="border p-2 w-full rounded"
      />

      <textarea
        value={description}
        onChange={(e)=>setDescription(e.target.value)}
        placeholder="Description"
        className="border p-2 w-full rounded"
      />

      <div className="grid grid-cols-2 gap-3">

        <select
          value={priority}
          onChange={(e)=>setPriority(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <select
          value={status}
          onChange={(e)=>setStatus(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="todo">Todo</option>
          <option value="inprogress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

      </div>

      <input
        type="datetime-local"
        value={dueDate}
        onChange={(e)=>setDueDate(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <button className={`px-4 py-2 text-white rounded ${
        editTask ? "bg-yellow-500" : "bg-green-500"
      }`}>
        {editTask ? "Update Task" : "Add Task"}
      </button>

    </form>
  );
}