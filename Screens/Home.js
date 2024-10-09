import { View, Text, Button } from "react-native";
import React, { useState } from "react";
import { Chartcanvas } from "../Components/chart/Chartcanvas";

export default function Home() {
  const [chart, setchart] = useState(true);

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
        </View>
        <View
          style={{
            flex: 1,
          }}
        >
          {chart ? <Chartcanvas /> : <Rbushcanvas />}
        </View>
      </View>
    </View>
  );
}
