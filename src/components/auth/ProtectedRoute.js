import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spin } from "antd";
import { UserAuthenticationContext } from "../../provider/UserAuthenticationProvider";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, idToken } = useContext(UserAuthenticationContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If authentication state has been determined and user is not authenticated
    if (isAuthenticated === false || (isAuthenticated !== null && !idToken)) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, idToken, navigate]);

  // Show loading spinner while authentication state is being determined
  if (isAuthenticated === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // If not authenticated, don't render children (redirect is handled in useEffect)
  if (isAuthenticated === false || !idToken) {
    return null;
  }

  // User is authenticated, render the protected content
  return children;
};

export default ProtectedRoute;
