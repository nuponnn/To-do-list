import {Navigate} from "react-router-dom";
import { AuthContext } from "./AuthPreventContext";
interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath: string;
  allowAuthenticated: boolean;
}

export default function ProtectedRoute(
    { children, fallbackPath, allowAuthenticated }: ProtectedRouteProps
){
    const { user } = AuthContext();
    if(allowAuthenticated && !user){
        return <Navigate to={fallbackPath} replace />;
    }
    if(!allowAuthenticated && user){
        return <Navigate to={fallbackPath} replace />;
    }
    return <>{children}</>;
}