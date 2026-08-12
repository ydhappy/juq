import { useMemo, useRef } from "react";
import { PanResponder, StyleSheet, View } from "react-native";
import Svg, { Circle, Line, Text as SvgText } from "react-native-svg";

import { wrapAngle } from "@/lib/protractor-math";

type Point = { x: number; y: number };

interface ProtractorOverlayProps {
  center: Point;
  size: number;
  onMoveStart: () => void;
  onMove: (dx: number, dy: number) => void;
  onScaleStart: () => void;
  onScale: (startDistance: number, currentDistance: number) => void;
  onMovingChange: (isMoving: boolean) => void;
}

const INK = "#0D1B2A";

function pointAt(cx: number, cy: number, radius: number, angle: number) {
  const radians = (angle * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

function distanceBetweenTouches(touches: readonly { pageX: number; pageY: number }[]) {
  if (touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
}

export function ProtractorOverlay({ center, size, onMoveStart, onMove, onScaleStart, onScale, onMovingChange }: ProtractorOverlayProps) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);
  const pinchStartDistance = useRef(0);
  const radius = size / 2;
  const innerRadius = radius * 0.68;
  const centerRadius = Math.max(14, size * 0.07);
  const ticks = Array.from({ length: 72 }, (_, index) => index * 5);
  const labels = Array.from({ length: 12 }, (_, index) => index * 30);

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
            return;
          }
          clearLongPress();
          longPressTimer.current = setTimeout(() => {
            isLongPress.current = true;
            onMoveStart();
            onMovingChange(true);
          }, 320);
        },
        onPanResponderMove: (event, gesture) => {
          const touchDistance = distanceBetweenTouches(event.nativeEvent.touches);
          if (touchDistance > 0) {
            clearLongPress();
            isLongPress.current = false;
            onMovingChange(false);
            if (pinchStartDistance.current === 0) {
              pinchStartDistance.current = touchDistance;
              onScaleStart();
              return;
            }
            onScale(pinchStartDistance.current, touchDistance);
            return;
          }

          if (!isLongPress.current && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4)) {
            clearLongPress();
          }
          if (isLongPress.current) onMove(gesture.dx, gesture.dy);
        },
        onPanResponderRelease: () => {
          clearLongPress();
          isLongPress.current = false;
          pinchStartDistance.current = 0;
          onMovingChange(false);
        },
        onPanResponderTerminate: () => {
          clearLongPress();
          isLongPress.current = false;
          pinchStartDistance.current = 0;
          onMovingChange(false);
        },
      }),
    [onMove, onMoveStart, onMovingChange, onScale, onScaleStart],
  );

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
        },
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={radius} cy={radius} r={radius - 3} fill="rgba(247,250,252,0.93)" stroke={INK} strokeWidth={2.5} />
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
              {wrapAngle(angle)}°
            </SvgText>
          );
        })}
        <Circle cx={radius} cy={radius} r={centerRadius} fill={INK} stroke="#FFFFFF" strokeWidth={2.5} />
        <Line x1={radius - centerRadius * 0.58} y1={radius} x2={radius + centerRadius * 0.58} y2={radius} stroke="#FFFFFF" strokeWidth={1.5} />
        <Line x1={radius} y1={radius - centerRadius * 0.58} x2={radius} y2={radius + centerRadius * 0.58} stroke="#FFFFFF" strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: "absolute", elevation: 3 },
});
