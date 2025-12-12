import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  const confirmationShown = useRef(false);

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh");
      const accessToken = localStorage.getItem("access");
      
      if (!refreshToken || !accessToken) {
        console.log("No tokens found, clearing storage");
        localStorage.clear();

        navigate("/");
        return;
      }

      const response = await fetch("http://localhost:8000/api/authentication/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      });

      localStorage.clear();
      localStorage.removeItem('username');

      navigate("/");
      
      if (response.ok) {
        console.log("Logout successful");
      } else {
        const errorData = await response.json();
        console.log("Logout completed with status:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error during logout:", error.message);
      localStorage.clear();
      navigate("/");
    }
  };

  useEffect(() => {
    if (!confirmationShown.current) {
      confirmationShown.current = true;
        handleLogout();
       
    }
  }, [navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl mb-4 text-gray-800">Logging out...</h2>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          onClick={() => navigate("/NewsPage")}
        >
          Cancel Logout
        </button>
      </div>
    </div>
  );
};

export default Logout;