import React, { useState, useEffect } from "react";
import PerformanceStats from "react-native-performance-stats";

// Custom Performance Limiter Component
const PerformanceLimiter = ({ children, maxPoints, minPoints, step = 50 }) => {
  const [pointsToRender, setPointsToRender] = useState(maxPoints);

  useEffect(() => {
    const listener = PerformanceStats.addListener((stats) => {
      const { jsFps } = stats;
      console.log(stats);
      if (jsFps < 30) {
        setPointsToRender((prev) => Math.max(minPoints, prev - step)); // Reduce points if FPS drops
      } else if (jsFps > 55) {
        setPointsToRender((prev) => Math.min(maxPoints, prev + step)); // Increase points if FPS is good
      }

      console.log(`FPS: ${jsFps}`);
    });

    PerformanceStats.start(true);

    return () => {
      listener.remove();
    };
  }, [maxPoints, minPoints, step]);

  return children(pointsToRender); // Pass the limited points to the child component
};

export default PerformanceLimiter;
