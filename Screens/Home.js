import { View, Text, Button } from "react-native";
import React, { useState } from "react";
import { Chartcanvas } from "../Components/chart/Chartcanvas";
import { Demo } from "../Components/chart/Demo";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ChartDemo } from "../Components/chart/ChartDemo";

export default function Home() {
  const [chart, setchart] = useState(true);
  const [atlas, setatlas] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <View
          style={{
            height: 50,
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}
        >
          <Button
            title="Rbush"
            onPress={() => {
              setchart(false);
            }}
          />
          <Button
            title="KDbush"
            onPress={() => {
              setchart(true);
            }}
          />
          <Button
            title="Atlas"
            onPress={() => {
              setatlas(!atlas);
            }}
          />
        </View>
        <View
          style={{
            flex: 1,
          }}
        >
          {atlas ? (
            <ChartDemo />
          ) : (
            <>{chart ? <Chartcanvas /> : <Rbushcanvas />}</>
          )}
        </View>
      </View>
    </View>
  );
}
