import { StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

import { wrapAngle } from "@/lib/protractor-math";

type Point = { x: number; y: number };

interface ProtractorOverlayProps {
  center: Point;
  size: number;
  selectedAngle: number | null;
}

const INK = "#F7FAFC";
const ORANGE = "#FF9F1C";

function pointAt(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

export function ProtractorOverlay({ center, size, selectedAngle }: ProtractorOverlayProps) {
  const radius = size / 2;
  const centerRadius = Math.max(7, size * 0.035);
  const ticks = Array.from({ length: 72 }, (_, index) => index * 5);
  const labels = Array.from({ length: 12 }, (_, index) => index * 30);
  const selectedPoint = selectedAngle === null ? null : pointAt(radius, radius, radius * 0.81, selectedAngle);

  return (
    <View pointerEvents="none" style={[styles.overlay, { left: center.x - radius, top: center.y - radius, width: size, height: size }]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={radius} cy={radius} r={radius - 3} fill="transparent" stroke="rgba(247,250,252,0.92)" strokeWidth={2.2} />
        {ticks.map((angle) => {
          const isMajor = angle % 30 === 0;
          const isMedium = angle % 10 === 0;
          const outer = pointAt(radius, radius, radius - 5, angle);
          const inner = pointAt(radius, radius, radius - (isMajor ? 20 : isMedium ? 14 : 9), angle);
          return <Line key={`tick-${angle}`} x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke={INK} strokeWidth={isMajor ? 1.5 : isMedium ? 1 : 0.6} strokeOpacity={isMajor ? 0.96 : 0.68} />;
        })}
        {labels.map((angle) => {
          const label = pointAt(radius, radius, radius * 0.77, angle);
          return <SvgText key={`label-${angle}`} x={label.x} y={label.y + 4} fill={INK} fontSize={Math.max(10, size * 0.052)} fontWeight="700" textAnchor="middle">{wrapAngle(angle)}°</SvgText>;
        })}
        {selectedPoint ? <Line x1={radius} y1={radius} x2={selectedPoint.x} y2={selectedPoint.y} stroke={ORANGE} strokeWidth={3} strokeLinecap="round" /> : null}
        {selectedPoint ? <Circle cx={selectedPoint.x} cy={selectedPoint.y} r={Math.max(5, size * 0.028)} fill={ORANGE} stroke="#FFFFFF" strokeWidth={1.6} /> : null}
        <Circle cx={radius} cy={radius} r={centerRadius} fill="transparent" stroke="rgba(247,250,252,0.88)" strokeWidth={1.3} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({ overlay: { position: "absolute", elevation: 3 } });
