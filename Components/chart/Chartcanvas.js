import React, { useState, useRef, useEffect } from "react";
import { Alert, Button, Dimensions, Text, TextInput, View } from "react-native";
import { Canvas, Circle, Fill, Path, Skia } from "@shopify/react-native-skia";
import { useSharedValue, withSpring } from "react-native-reanimated";
import KDBush from "kdbush";
import PerformanceStats from "react-native-performance-stats";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const MemoizedCircle = React.memo(({ cx, cy, r, color }) => {
  return <Circle cx={cx} cy={cy} r={r} color={color} />;
});

// const Limiter = ({ children, maxPoints }) => {
//   const [pointsCount, setPointsCount] = useState(0);

//   // Function to add a point
//   const addPoint = (addPointCallback) => {
//     if (pointsCount < maxPoints) {
//       addPointCallback();
//       setPointsCount(pointsCount + 1);
//     } else {
//       Alert.alert("Limit Reached", "You cannot add more points.");
//     }
//   };

//   // Function to remove a point
//   const removePoint = (removePointCallback) => {
//     if (pointsCount > 0) {
//       removePointCallback();
//       setPointsCount(pointsCount - 1);
//     } else {
//       Alert.alert("No Points to Remove", "There are no points to remove.");
//     }
//   };

//   return children(addPoint, removePoint, pointsCount);
// };
export const Chartcanvas = () => {
  const graphWidth = 400;
  const graphHeight = 700;

  const [activePoint, setActivePoint] = useState(null);
  const kdbushIndex = useRef(null);
  const [isIndexReady, setIsIndexReady] = useState(false);
  const [numPointsToAdd, setNumPointsToAdd] = useState(""); // User input for number of points
  const [pointsMovedCount, setPointsMovedCount] = useState(0);
  const [cpuUsage, setCpuUsage] = useState(0); // CPU usage state
  const [maxPoints, setMaxPoints] = useState(100); // Dynamically adjusted point limit
  // Create points with useSharedValue
  const pointsArray = useRef(
    Array.from({ length: 100 }).map((_, i) => {
      const x = useSharedValue(Math.random() * graphWidth);
      const y = useSharedValue(Math.random() * graphHeight);
      return { id: i, x, y };
    })
  ).current;

  const rebuildKDBushIndex = () => {
    const index = new KDBush(pointsArray.length);
    pointsArray.forEach((point) => index.add(point.x.value, point.y.value));
    index.finish();
    kdbushIndex.current = index;
    setIsIndexReady(true); // Mark the index as ready
  };

  useEffect(() => {
    rebuildKDBushIndex();
  }, [pointsArray]);

  // Function to get points within viewport
  const getPointsInView = (minX, minY, maxX, maxY) => {
    if (!kdbushIndex.current) return []; // Return empty if index is not ready
    const ids = kdbushIndex.current.range(minX, minY, maxX, maxY);
    return ids.map((id) => pointsArray[id]);
  };

  const visiblePoints = isIndexReady
    ? getPointsInView(0, 0, graphWidth, graphHeight)
    : [];

  // const visiblePoints = getPointsInView(0, 0, graphWidth, graphHeight);
  // Find the nearest point using KDBush's within method
  const findNearestPoint = (x, y) => {
    const radius = 20;
    const ids = kdbushIndex.current.within(x, y, radius);
    if (ids.length > 0) {
      return pointsArray[ids[0]]; // Get the nearest point by id
    }
    return null;
  };

  // the function to take the values of the first gesture
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

      // Update the point's position, but don't rebuild the index yet
      activePoint.x.value = boundedX;
      activePoint.y.value = boundedY;
    }
  };

  const handleTouchEnd = () => {
    // setActivePoint(null);

    // Once dragging stops, optionally rebuild the index if points have moved
    // setActivePoint(null);

    // Optional: rebuild the KDBush index after dragging stops
    // if (pointsMoved) {
    const updatedPoints = pointsArray.map((p) => ({
      x: p.x.value,
      y: p.y.value,
    }));
    const newIndex = new KDBush(updatedPoints.length);
    updatedPoints.forEach((point) => newIndex.add(point.x, point.y));
    newIndex.finish();
    kdbushIndex.current = newIndex;
    // }
  };

  const createPath = () => {
    const path = Skia.Path.Make(); // Create a new path
    if (pointsArray.length > 0) {
      path.moveTo(pointsArray[0].x.value, pointsArray[0].y.value); // Start at the first point
      pointsArray.forEach((point) => {
        path.lineTo(point.x.value, point.y.value); // Draw a line to each subsequent point
      });
    }
    return path;
  };

  const deleteActivePoint = () => {
    // console.log(activePoint.x.value);

    if (activePoint) {
      // console.log(activePoint);
      Alert.alert(
        "Delete Point",
        "Are you sure you want to delete this point?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            onPress: () => {
              // Find the index of the point and remove it from the points array
              const index = pointsArray.indexOf(activePoint);
              if (index > -1) {
                pointsArray.splice(index, 1);
                setActivePoint(null);

                // Rebuild the KDBush index after deleting the point
                rebuildKDBushIndex();
              }
            },
            style: "destructive",
          },
        ]
      );
    }
  };

  useEffect(() => {
    const listener = PerformanceStats.addListener((stats) => {
      setCpuUsage(stats.usedCpu);
      adjustMaxPoints(stats.usedCpu);
    });

    PerformanceStats.start(true);

    return () => {
      listener.remove();
      PerformanceStats.stop();
    };
  }, []);

  // Adjust max points based on CPU usage
  const adjustMaxPoints = (cpu) => {
    if (cpu / 2 < 30) {
      setMaxPoints(1000); // Low CPU usage: allow more points
    } else if (cpu / 2 >= 30 && cpu / 2 < 70) {
      setMaxPoints(500); // Moderate CPU usage: limit points
    } else {
      setMaxPoints(200); // High CPU usage: restrict points
    }
  };

  const handleAddPoints = () => {
    const pointsToAdd = parseInt(numPointsToAdd, 10);

    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
      Alert.alert("Invalid input", "Please enter a positive number.");
      return;
    }

    if (pointsArray.length + pointsToAdd > maxPoints) {
      Alert.alert(
        "Limit Reached",
        `Cannot add more than ${maxPoints} points due to CPU usage.`
      );
      return;
    }

    for (let i = 0; i < pointsToAdd; i++) {
      pointsArray.push({
        id: pointsArray.length + i,
        x: Math.random() * graphWidth,
        y: Math.random() * graphHeight,
      });
    }

    rebuildKDBushIndex();
  };
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
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

          {visiblePoints.map((point) => (
            <MemoizedCircle
              key={point.id}
              cx={point.x}
              cy={point.y}
              r={6}
              color="#3E3E"
            />
          ))}
        </Canvas>
      </View>
      <View
        style={{
          height: 50,
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "row",
        }}
      >
        <Text>currentpoints:{pointsArray.length}</Text>
        <TextInput
          style={{
            height: 40,
            width: 50,
            borderColor: "gray",
            borderWidth: 1,
            marginLeft: 10,
            paddingHorizontal: 5,
          }}
          keyboardType="numeric"
          value={numPointsToAdd}
          onChangeText={setNumPointsToAdd}
          placeholder="Points"
        />
        <Button title="Add Points" onPress={handleAddPoints} />
        {/* <Button
          title="delete point"
          onPress={deleteActivePoint}
          disabled={!activePoint}
        /> */}
      </View>
    </View>
  );
};
