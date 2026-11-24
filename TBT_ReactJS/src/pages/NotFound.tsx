import React from "react";
import { useNavigate } from "react-router-dom";
import { isTokenValid } from "@/lib/jwt";

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    // If user is logged in, redirect to dashboard, otherwise to landing page
    if (isTokenValid()) {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-white border-2 border-black flex items-center justify-center p-8">
      <div className="max-w-2xl w-full flex flex-col items-center justify-center gap-6 text-center">
        <h1 className="text-8xl md:text-9xl font-bold text-black">404</h1>
        <h2 className="text-3xl md:text-4xl font-bold text-black">UH OH! You're lost.</h2>
        <p className="text-base md:text-lg text-black max-w-md">
          The page you are looking for does not exist. How you got here is a mystery. But you can click the button below to go back to the homepage.
        </p>
        <button
          onClick={handleGoHome}
          className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
        >
          GO TO HOME PAGE
        </button>
      </div>
    </div>
  );
};

export default NotFound;

