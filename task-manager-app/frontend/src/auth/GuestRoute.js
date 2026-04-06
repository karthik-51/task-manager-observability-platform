import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import { Navigate } from "react-router-dom";

export default function GuestRoute({ children }) {
  const { user } = useContext(AuthContext);
  return user ? <Navigate to="/dashboard" /> : children;
}
