import React, { useState, useRef, useEffect } from "react";
import { Dimensions } from "react-native";
import { Canvas, Circle, Fill, Path, Skia } from "@shopify/react-native-skia";
import { useSharedValue, withSpring } from "react-native-reanimated";
import rbush from "rbush";
import PerformanceStats from "react-native-performance-stats";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MemoizedCircle = React.memo(({ cx, cy, r, color }) => {
  return <Circle cx={cx} cy={cy} r={r} color={color} />;
});

export const Rbushcanvas = () => {
  const graphWidth = 400;
  const graphHeight = 700;

  const [activePoint, setActivePoint] = useState(null);
  const rbushIndex = useRef(new rbush());

  var bush = new rbush();

  // Generate points and insert them into rbush
  const points = useRef(
    Array.from({ length: 100 }).map((_, i) => {
      const x = useSharedValue(Math.random() * graphWidth);
      const y = useSharedValue(Math.random() * graphHeight);

      const point = {
        id: i,
        x,
        y,
        minX: x.value,
        minY: y.value,
        maxX: x.value,
        maxY: y.value,
      };

      // Insert the point into the rbush
      rbushIndex.current.insert(point);
      return point;
    })
  ).current;

  // to locate the point according to the initail gesture values by searching with rbush
  const findNearestPoint = (x, y) => {
    const searchRadius = 20;
    const range = {
      minX: x - searchRadius,
      minY: y - searchRadius,
      maxX: x + searchRadius,
      maxY: y + searchRadius,
    };

    console.log(rbushIndex.current.search(range));

    const candidates = rbushIndex.current.search(range);
    // console.log(candidates);
    let nearestPoint = null;
    let minDistance = Infinity;

    candidates.forEach((candidate) => {
      const dx = candidate.x.value - x;
      const dy = candidate.y.value - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = candidate;
      }
    });

    return nearestPoint;
  };

  // use this function to locate and take the cords of the  inital gesture
  const handleTouchStart = (e) => {
    const { locationX, locationY } = e.nativeEvent;
    const nearestPoint = findNearestPoint(locationX, locationY);
    if (nearestPoint) {
      setActivePoint(nearestPoint);
    }
  };

  const handleTouchMove = (e) => {
    if (activePoint) {
      const { locationX, locationY } = e.nativeEvent;
      const boundedX = Math.min(Math.max(locationX, 0), graphWidth);
      const boundedY = Math.min(Math.max(locationY, 0), graphHeight);

      // Update the point's position
      // activePoint.x.value = withSpring(boundedX);
      // activePoint.y.value = withSpring(boundedY);
      activePoint.x.value = boundedX;
      activePoint.y.value = boundedY;

      // Remove the old point from rbush and reinsert the updated one
      rbushIndex.current.remove(activePoint);
      activePoint.minX = boundedX;
      activePoint.minY = boundedY;
      activePoint.maxX = boundedX;
      activePoint.maxY = boundedY;
      rbushIndex.current.insert(activePoint);
    }
  };

  const handleTouchEnd = () => {
    setActivePoint(null);
  };

  const createPath = () => {
    const path = Skia.Path.Make(); // Create a new path
    if (points.length > 0) {
      path.moveTo(points[0].x.value, points[0].y.value); // Start at the first point
      points.forEach((point) => {
        path.lineTo(point.x.value, point.y.value); // Draw a line to each subsequent point
      });
    }
    return path;
  };

  useEffect(() => {
    const listener = PerformanceStats.addListener((stats) => {
      console.log(stats);
    });

    // Test log
    console.log("logs for rbush");
    console.log("pointsArray ", points.length);

    // you must call .start(true) to get CPU as well
    PerformanceStats.start(true);

    // ... at some later point you could call:
    // PerformanceStats.stop();

    return () => listener.remove();
  }, []);

  return (
    <Canvas
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: "red",
        width: graphWidth,
        height: graphHeight,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Fill color="white" />
      {/* <Path path={createPath()} color="black" style="stroke" strokeWidth={2} /> */}
      {/* Render points */}
      {points.map((point) => (
        <MemoizedCircle
          key={point.id}
          cx={point.x}
          cy={point.y}
          r={10}
          color="#3E3E"
        />
      ))}
    </Canvas>
  );
};
