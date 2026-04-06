

import axios from "../api/axios";

export default function TaskList({ tasks, refresh, setEditTask }) {

  const deleteTask = async (id) => {
    await axios.delete(`/tasks/${id}`);
    refresh();
  };

  const toggleComplete = async (task) => {

    await axios.put(`/tasks/${task._id}`, {
      ...task,
      completed: !task.completed
    });

    refresh();
  };

  const getPriorityColor = (priority) => {
    if (priority === "high") return "bg-red-500";
    if (priority === "medium") return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStatusColor = (status) => {
    if (status === "todo") return "bg-gray-500";
    if (status === "inprogress") return "bg-blue-500";
    return "bg-green-500";
  };

  return (

    <div className="space-y-3">

      {tasks.map((task) => (

        <div
          key={task._id}
          className="bg-white p-4 shadow rounded flex justify-between items-center"
        >

          <div className="flex items-center gap-3">

            <input
              type="checkbox"
              checked={task.completed}
              onChange={()=>toggleComplete(task)}
            />

            <div>

              <div className={`font-semibold ${
                task.completed ? "line-through text-gray-400" : ""
              }`}>
                {task.title}
              </div>

              {task.description && (
                <div className="text-sm text-gray-500">
                  {task.description}
                </div>
              )}

              <div className="flex gap-2 mt-1">

                <span className={`text-xs text-white px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>

                <span className={`text-xs text-white px-2 py-1 rounded ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>

                {task.dueDate && (
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">
                    Due: {task.dueDate.substring(0,10)}
                  </span>
                )}

              </div>

            </div>

          </div>

          <div className="flex gap-2">

            <button
              onClick={()=>setEditTask(task)}
              className="bg-yellow-400 px-3 py-1 rounded text-sm"
            >
              Edit
            </button>

            <button
              onClick={()=>deleteTask(task._id)}
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
            >
              Delete
            </button>

          </div>

        </div>

      ))}

    </div>

  );
}