import React, { useState, useRef, useEffect } from "react";
import { Alert, Button, Dimensions, Text, TextInput, View } from "react-native";
import {
  Canvas,
  Fill,
  Group,
  Rect,
  Atlas,
  useTexture,
  Skia,
  rect,
} from "@shopify/react-native-skia";
import { useSharedValue } from "react-native-reanimated";
import KDBush from "kdbush";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export const ChartDemo = () => {
  const graphWidth = 400;
  const graphHeight = 700;

  const [activePoint, setActivePoint] = useState(null);
  const kdbushIndex = useRef(null);
  const [isIndexReady, setIsIndexReady] = useState(false);
  const [numPointsToAdd, setNumPointsToAdd] = useState("");

  // Create a state for point IDs and shared values separately
  const [pointsArray, setPointsArray] = useState(
    Array.from({ length: 100 }, (_, i) => i)
  ); // Only IDs
  const sharedValuesRef = useRef(
    pointsArray.map(() => ({
      x: useSharedValue(Math.random() * graphWidth),
      y: useSharedValue(Math.random() * graphHeight),
    }))
  );

  const rebuildKDBushIndex = () => {
    const index = new KDBush(pointsArray.length);
    pointsArray.forEach((id) => {
      const point = sharedValuesRef.current[id];
      index.add(point.x.value, point.y.value);
    });
    index.finish();
    kdbushIndex.current = index;
    setIsIndexReady(true);
  };

  useEffect(() => {
    rebuildKDBushIndex();
  }, [pointsArray]);

  const getPointsInView = (minX, minY, maxX, maxY) => {
    if (!kdbushIndex.current) return [];
    const ids = kdbushIndex.current.range(minX, minY, maxX, maxY);
    return ids.map((id) => sharedValuesRef.current[id]);
  };

  const visiblePoints = isIndexReady
    ? getPointsInView(0, 0, graphWidth, graphHeight)
    : [];

  const createTexture = () => {
    return (
      <Group>
        <Rect rect={rect(0, 0, 12, 12)} color="cyan" />
        <Rect
          rect={rect(0, 0, 12, 12)}
          color="blue"
          style="stroke"
          strokeWidth={2}
        />
      </Group>
    );
  };

  const texture = useTexture(createTexture(), { width: 12, height: 12 });

  const sprites = visiblePoints.map(() => rect(0, 0, 12, 12));

  const transforms = visiblePoints.map((point) => {
    const x = point.x.value;
    const y = point.y.value;
    return Skia.RSXform(1, 0, x, y); // No rotation or scaling, just position
  });

  const handleAddPoints = () => {
    const pointsToAdd = parseInt(numPointsToAdd, 10);
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
      Alert.alert("Invalid input", "Please enter a positive number.");
      return;
    }

    const newIds = Array.from(
      { length: pointsToAdd },
      (_, i) => pointsArray.length + i
    );
    setPointsArray((prev) => [...prev, ...newIds]);

    // Initialize SharedValues for new points
    const newSharedValues = newIds.map((id) => ({
      x: useSharedValue(Math.random() * graphWidth),
      y: useSharedValue(Math.random() * graphHeight),
    }));

    sharedValuesRef.current.push(...newSharedValues);
    rebuildKDBushIndex(); // Rebuild index after adding points
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
        >
          <Fill color="white" />
          <Atlas image={texture} sprites={sprites} transforms={transforms} />
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
        <Text>Current Points: {pointsArray.length}</Text>
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
      </View>
    </View>
  );
};
