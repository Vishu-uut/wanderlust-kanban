
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/app/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="text-center max-w-md p-8 rounded-xl shadow-sm border bg-white">
        <h1 className="text-7xl font-light mb-4 text-primary">404</h1>
        <p className="text-xl text-gray-600 mb-6">This page doesn't exist</p>
        <Button asChild>
          <a href="/">Return to Home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
