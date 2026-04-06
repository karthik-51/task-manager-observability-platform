import { Link } from "react-router-dom";

export default function Home() {

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* NAVBAR */}
      <div className="flex justify-between items-center px-10 py-5 bg-white shadow-sm">

        <h1 className="text-xl font-bold text-blue-600">
          Task Manager
        </h1>

        <div className="flex gap-6 items-center">

          <Link
            to="/login"
            className="text-gray-600 hover:text-blue-600 font-medium"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
          >
            Get Started
          </Link>

        </div>

      </div>

      {/* HERO */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-24 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">

        <h1 className="text-5xl font-bold max-w-3xl leading-tight">
          Manage Tasks Faster & Smarter
        </h1>

        <p className="mt-6 text-lg max-w-xl opacity-90">
          Plan, organize, and track tasks across teams with a powerful
          task management system built for productivity.
        </p>

        <div className="flex gap-4 mt-8">

          <Link
            to="/register"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Get Started
          </Link>

          <Link
            to="/login"
            className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-blue-600"
          >
            Login
          </Link>

        </div>

      </div>

      {/* FEATURES */}
      <div className="py-20 bg-white">

        <h2 className="text-3xl font-bold text-center mb-12">
          Powerful Features
        </h2>

        <div className="grid md:grid-cols-3 gap-8 px-10 max-w-6xl mx-auto">

          <div className="p-8 border rounded-xl hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-3">
              Task Board
            </h3>
            <p className="text-gray-500">
              Organize tasks visually with an intuitive board system similar
              to modern project management tools.
            </p>
          </div>

          <div className="p-8 border rounded-xl hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-3">
              Analytics Dashboard
            </h3>
            <p className="text-gray-500">
              Track productivity metrics and analyze project progress with
              powerful insights.
            </p>
          </div>

          <div className="p-8 border rounded-xl hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-3">
              Smart Notifications
            </h3>
            <p className="text-gray-500">
              Get automated reminders and alerts for deadlines and overdue
              tasks.
            </p>
          </div>

        </div>

      </div>

      {/* CTA SECTION */}
      <div className="bg-blue-600 text-white py-20 text-center">

        <h2 className="text-3xl font-bold mb-4">
          Ready to boost productivity?
        </h2>

        <p className="mb-8 opacity-90">
          Start managing your tasks today and stay organized.
        </p>

        <Link
          to="/register"
          className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          Create Free Account
        </Link>

      </div>

      {/* FOOTER */}
      <div className="bg-gray-900 text-gray-400 text-center py-6 text-sm">

        <p>© 2026 Enterprise Task Manager</p>

      </div>

    </div>
  );
}