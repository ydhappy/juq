import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { ProtractorOverlay } from "@/components/protractor-overlay";
import { ScreenContainer } from "@/components/screen-container";
import { clampNumber, scaleFromPinch } from "@/lib/protractor-math";

type Center = { x: number; y: number };

const INK = "#0D1B2A";
const PAPER = "#F7FAFC";

function GridBackground() {
  const lines = Array.from({ length: 9 }, (_, index) => (index + 1) * 10);
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.grid}>
      {lines.map((value) => (
        <Line key={`v-${value}`} x1={value} y1="0" x2={value} y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.28" />
      ))}
      {lines.map((value) => (
        <Line key={`h-${value}`} x1="0" y1={value} x2="100" y2={value} stroke="rgba(255,255,255,0.08)" strokeWidth="0.28" />
      ))}
      <Path d="M 0 75 C 22 53, 37 85, 55 62 S 80 35, 100 44" fill="none" stroke="rgba(0,194,209,0.42)" strokeWidth="0.72" />
    </Svg>
  );
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const workspaceSize = Math.max(300, Math.min(width - 32, height - 255, 520));
  const [scale, setScale] = useState(0.92);
  const [center, setCenter] = useState<Center>({ x: workspaceSize / 2, y: workspaceSize / 2 });
  const [isMoving, setIsMoving] = useState(false);
  const moveOrigin = useRef<Center>(center);
  const pinchOriginScale = useRef(scale);
  const protractorSize = workspaceSize * scale;
  const centerForWorkspace = useMemo(
    () => ({
      x: clampNumber(center.x, protractorSize * 0.27, workspaceSize - protractorSize * 0.27),
      y: clampNumber(center.y, protractorSize * 0.27, workspaceSize - protractorSize * 0.27),
    }),
    [center, protractorSize, workspaceSize],
  );

  const handleMoveStart = () => {
    moveOrigin.current = centerForWorkspace;
  };

  const handleMove = (dx: number, dy: number) => {
    setCenter({
      x: clampNumber(moveOrigin.current.x + dx, protractorSize * 0.27, workspaceSize - protractorSize * 0.27),
      y: clampNumber(moveOrigin.current.y + dy, protractorSize * 0.27, workspaceSize - protractorSize * 0.27),
    });
  };

  const handleScale = (startDistance: number, currentDistance: number) => {
    setScale(scaleFromPinch(pinchOriginScale.current, startDistance, currentDistance));
  };

  const handleScaleStart = () => {
    pinchOriginScale.current = scale;
  };

  const handleMovingChange = (moving: boolean) => {
    setIsMoving(moving);
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background" safeAreaClassName="bg-background">
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Juq 360</Text>
          <Text style={styles.subtitle}>순수 360° 각도기</Text>
        </View>

        <View style={[styles.workspace, { width: workspaceSize, height: workspaceSize }]}>
          <GridBackground />
          <ProtractorOverlay
            center={centerForWorkspace}
            size={protractorSize}
            onMoveStart={handleMoveStart}
            onMove={handleMove}
            onScaleStart={handleScaleStart}
            onScale={handleScale}
            onMovingChange={handleMovingChange}
          />
          <View pointerEvents="none" style={styles.statusBadge}>
            <Text style={styles.statusText}>{isMoving ? "이동 중" : `${Math.round(scale * 100)}%`}</Text>
          </View>
        </View>

        <View style={styles.gestureGuide}>
          <View style={styles.guideItem}>
            <Text style={styles.guideIcon}>⇆</Text>
            <Text style={styles.guideText}>두 손가락으로 확대·축소</Text>
          </View>
          <View style={styles.guideDivider} />
          <View style={styles.guideItem}>
            <Text style={styles.guideIcon}>✥</Text>
            <Text style={styles.guideText}>0.3초 길게 누른 뒤 이동</Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "space-between", backgroundColor: INK, paddingHorizontal: 16, paddingVertical: 12 },
  header: { width: "100%", alignItems: "center", paddingTop: 4 },
  title: { color: PAPER, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: "rgba(247,250,252,0.62)", fontSize: 12, fontWeight: "700", letterSpacing: 1.1, marginTop: 1 },
  workspace: { position: "relative", overflow: "hidden", borderRadius: 28, backgroundColor: "#152F42", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  grid: { position: "absolute" },
  statusBadge: { position: "absolute", left: 12, bottom: 12, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(13,27,42,0.72)" },
  statusText: { color: PAPER, fontSize: 11, fontWeight: "800" },
  gestureGuide: { width: "100%", minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderRadius: 18, borderWidth: 1, borderColor: "rgba(247,250,252,0.16)", backgroundColor: "rgba(247,250,252,0.08)", paddingHorizontal: 8 },
  guideItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  guideIcon: { color: "#00C2D1", fontSize: 18, lineHeight: 20, fontWeight: "800" },
  guideText: { color: PAPER, marginTop: 3, fontSize: 11, fontWeight: "700", textAlign: "center" },
  guideDivider: { height: 30, width: 1, backgroundColor: "rgba(247,250,252,0.18)" },
});
