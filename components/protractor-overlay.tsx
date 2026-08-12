import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Path, Text as SvgText } from "react-native-svg";

import { wrapAngle } from "@/lib/protractor-math";

type Point = { x: number; y: number };

interface ProtractorOverlayProps {
  center: Point;
  size: number;
  baseAngle: number;
  measureAngle: number;
  opacity: number;
  interactionMode: "move" | "measure" | "passive";
  measurementStep: "base" | "measure";
  onMoveStart: () => void;
  onMove: (dx: number, dy: number) => void;
  onMeasureTouch: (x: number, y: number) => void;
}

const CYAN = "#00C2D1";
const ORANGE = "#FF9F1C";
const INK = "#0D1B2A";

function pointAt(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number) {
  const sweep = wrapAngle(endAngle - startAngle);
  if (sweep === 0) return "";
  const start = pointAt(cx, cy, radius, startAngle);
  const end = pointAt(cx, cy, radius, endAngle);
  const largeArc = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

export function ProtractorOverlay({
  center,
  size,
  baseAngle,
  measureAngle,
  opacity,
  interactionMode,
  measurementStep,
  onMoveStart,
  onMove,
  onMeasureTouch,
}: ProtractorOverlayProps) {
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => interactionMode !== "passive",
    onMoveShouldSetPanResponder: (_, gesture) => interactionMode === "move" && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
    onPanResponderGrant: () => {
      if (interactionMode === "move") onMoveStart();
    },
    onPanResponderMove: (_, gesture) => {
      if (interactionMode === "move") onMove(gesture.dx, gesture.dy);
    },
    onPanResponderRelease: (event) => {
      if (interactionMode === "measure") {
        onMeasureTouch(event.nativeEvent.locationX, event.nativeEvent.locationY);
      }
    },
  });

  const radius = size / 2;
  const innerRadius = radius * 0.68;
  const centerRadius = Math.max(14, size * 0.07);
  const baselineEnd = pointAt(radius, radius, radius * 0.79, baseAngle);
  const measureEnd = pointAt(radius, radius, radius * 0.79, measureAngle);
  const arcPath = describeArc(radius, radius, radius * 0.29, baseAngle, measureAngle);
  const ticks = Array.from({ length: 72 }, (_, index) => index * 5);
  const labels = Array.from({ length: 12 }, (_, index) => index * 30);

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.overlay,
        {
          left: center.x - radius,
          top: center.y - radius,
          width: size,
          height: size,
          opacity,
        },
      ]}
      pointerEvents={interactionMode === "passive" ? "none" : "auto"}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={radius} cy={radius} r={radius - 3} fill="rgba(247,250,252,0.86)" stroke={INK} strokeWidth={2.5} />
        <Circle cx={radius} cy={radius} r={innerRadius} fill="none" stroke="rgba(13,27,42,0.16)" strokeWidth={1} />
        <Circle cx={radius} cy={radius} r={radius * 0.44} fill="none" stroke="rgba(13,27,42,0.13)" strokeWidth={1} strokeDasharray="3 4" />

        {ticks.map((angle) => {
          const isMajor = angle % 30 === 0;
          const isMedium = angle % 10 === 0;
          const outer = pointAt(radius, radius, radius - 7, angle);
          const inner = pointAt(radius, radius, radius - (isMajor ? 22 : isMedium ? 16 : 11), angle);
          return (
            <Line
              key={`tick-${angle}`}
              x1={outer.x}
              y1={outer.y}
              x2={inner.x}
              y2={inner.y}
              stroke={INK}
              strokeWidth={isMajor ? 1.7 : isMedium ? 1.15 : 0.7}
              strokeOpacity={isMajor ? 0.86 : 0.5}
            />
          );
        })}

        {labels.map((angle) => {
          const label = pointAt(radius, radius, radius * 0.77, angle);
          return (
            <SvgText
              key={`label-${angle}`}
              x={label.x}
              y={label.y + 4}
              fill={INK}
              fontSize={Math.max(10, size * 0.052)}
              fontWeight="700"
              textAnchor="middle"
            >
              {angle}°
            </SvgText>
          );
        })}

        {arcPath ? <Path d={arcPath} fill="none" stroke={ORANGE} strokeWidth={5} strokeLinecap="round" /> : null}
        <Line x1={radius} y1={radius} x2={baselineEnd.x} y2={baselineEnd.y} stroke={CYAN} strokeWidth={4} strokeLinecap="round" />
        <Line x1={radius} y1={radius} x2={measureEnd.x} y2={measureEnd.y} stroke={ORANGE} strokeWidth={4} strokeLinecap="round" />
        <Circle cx={baselineEnd.x} cy={baselineEnd.y} r={Math.max(6, size * 0.035)} fill={CYAN} stroke="#FFFFFF" strokeWidth={2} />
        <Circle cx={measureEnd.x} cy={measureEnd.y} r={Math.max(6, size * 0.035)} fill={ORANGE} stroke="#FFFFFF" strokeWidth={2} />
        <Circle cx={radius} cy={radius} r={centerRadius} fill={interactionMode === "measure" ? (measurementStep === "base" ? CYAN : ORANGE) : INK} stroke="#FFFFFF" strokeWidth={2.5} />
        <Line x1={radius - centerRadius * 0.58} y1={radius} x2={radius + centerRadius * 0.58} y2={radius} stroke="#FFFFFF" strokeWidth={1.5} />
        <Line x1={radius} y1={radius - centerRadius * 0.58} x2={radius} y2={radius + centerRadius * 0.58} stroke="#FFFFFF" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    elevation: 3,
  },
});
