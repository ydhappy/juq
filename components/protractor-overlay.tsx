import { useMemo, useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

import { wrapAngle } from "@/lib/protractor-math";

type Point = { x: number; y: number };

interface ProtractorOverlayProps {
  center: Point;
  size: number;
  selectedAngle: number | null;
  onMoveStart: () => void;
  onMove: (dx: number, dy: number) => void;
  onScaleStart: () => void;
  onScale: (startDistance: number, currentDistance: number) => void;
  onTap: (x: number, y: number) => void;
  onLongPress: (x: number, y: number) => void;
}

const INK = "#F7FAFC";
const ORANGE = "#FF9F1C";

function pointAt(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function distanceBetweenTouches(touches: readonly { pageX: number; pageY: number }[]) {
  if (touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
}

export function ProtractorOverlay({ center, size, selectedAngle, onMoveStart, onMove, onScaleStart, onScale, onTap, onLongPress }: ProtractorOverlayProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchPoint = useRef({ x: size / 2, y: size / 2 });
  const longPressTriggered = useRef(false);
  const isDragging = useRef(false);
  const pinchStartDistance = useRef(0);
  const radius = size / 2;
  const centerRadius = Math.max(7, size * 0.035);
  const ticks = Array.from({ length: 72 }, (_, index) => index * 5);
  const labels = Array.from({ length: 12 }, (_, index) => index * 30);
  const selectedPoint = selectedAngle === null ? null : pointAt(radius, radius, radius * 0.81, selectedAngle);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const touchDistance = distanceBetweenTouches(event.nativeEvent.touches);
          if (touchDistance > 0) {
            pinchStartDistance.current = touchDistance;
            onScaleStart();
            return;
          }
          touchPoint.current = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
          longPressTriggered.current = false;
          isDragging.current = false;
          clearLongPress();
          longPressTimer.current = setTimeout(() => {
            if (!isDragging.current) {
              longPressTriggered.current = true;
              onLongPress(touchPoint.current.x, touchPoint.current.y);
            }
          }, 430);
        },
        onPanResponderMove: (event, gesture) => {
          const touchDistance = distanceBetweenTouches(event.nativeEvent.touches);
          if (touchDistance > 0) {
            clearLongPress();
            isDragging.current = false;
            if (pinchStartDistance.current === 0) {
              pinchStartDistance.current = touchDistance;
              onScaleStart();
              return;
            }
            onScale(pinchStartDistance.current, touchDistance);
            return;
          }
          if (!longPressTriggered.current && (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5)) {
            clearLongPress();
            if (!isDragging.current) {
              isDragging.current = true;
              onMoveStart();
            }
          }
          if (isDragging.current) onMove(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: (event, gesture) => {
          const wasPinching = pinchStartDistance.current > 0;
          clearLongPress();
          pinchStartDistance.current = 0;
          if (!longPressTriggered.current && !isDragging.current && !wasPinching && Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
            onTap(event.nativeEvent.locationX, event.nativeEvent.locationY);
          }
          isDragging.current = false;
        },
        onPanResponderTerminate: () => {
          clearLongPress();
          pinchStartDistance.current = 0;
          isDragging.current = false;
        },
      }),
    [onLongPress, onMove, onMoveStart, onScale, onScaleStart, onTap],
  );

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.overlay,
        { left: center.x - radius, top: center.y - radius, width: size, height: size },
      ]}
    >
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
