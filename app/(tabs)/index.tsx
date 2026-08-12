import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { AnnotationLayer, type Mark, type MarkKind } from "@/components/annotation-layer";
import { ProtractorOverlay } from "@/components/protractor-overlay";
import { ScreenContainer } from "@/components/screen-container";
import { clampNumber, pointToAngle, scaleFromPinch } from "@/lib/protractor-math";

type Center = { x: number; y: number };
type MenuMode = "tools" | "note" | null;

const INK = "#0D1B2A";
const PAPER = "#F7FAFC";

function GridBackground() {
  const lines = Array.from({ length: 9 }, (_, index) => (index + 1) * 10);
  return (
    <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.grid}>
      {lines.map((value) => <Line key={`v-${value}`} x1={value} y1="0" x2={value} y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.28" />)}
      {lines.map((value) => <Line key={`h-${value}`} x1="0" y1={value} x2="100" y2={value} stroke="rgba(255,255,255,0.08)" strokeWidth="0.28" />)}
      <Path d="M 0 75 C 22 53, 37 85, 55 62 S 80 35, 100 44" fill="none" stroke="rgba(0,194,209,0.42)" strokeWidth="0.72" />
    </Svg>
  );
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const workspaceSize = Math.max(300, Math.min(width - 32, height - 255, 520));
  const [scale, setScale] = useState(0.92);
  const [center] = useState<Center>({ x: workspaceSize / 2, y: workspaceSize / 2 });
  const [selectedAngle, setSelectedAngle] = useState<number | null>(null);
  const [menuMode, setMenuMode] = useState<MenuMode>(null);
  const [menuPoint, setMenuPoint] = useState<Center>({ x: workspaceSize / 2, y: workspaceSize / 2 });
  const [noteText, setNoteText] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const pinchOriginScale = useRef(scale);
  const protractorSize = workspaceSize * scale;
  const centerForWorkspace = useMemo(
    () => ({
      x: clampNumber(center.x, protractorSize * 0.27, workspaceSize - protractorSize * 0.27),
      y: clampNumber(center.y, protractorSize * 0.27, workspaceSize - protractorSize * 0.27),
    }),
    [center, protractorSize, workspaceSize],
  );

  const handleScaleStart = () => {
    pinchOriginScale.current = scale;
  };

  const handleScale = (startDistance: number, currentDistance: number) => {
    setScale(scaleFromPinch(pinchOriginScale.current, startDistance, currentDistance));
  };

  const toWorkspacePoint = (localX: number, localY: number) => ({
    x: clampNumber(centerForWorkspace.x - protractorSize / 2 + localX, 10, workspaceSize - 10),
    y: clampNumber(centerForWorkspace.y - protractorSize / 2 + localY, 10, workspaceSize - 10),
  });

  const handleTap = (localX: number, localY: number) => {
    setSelectedAngle(pointToAngle(localX, localY, protractorSize / 2, protractorSize / 2));
  };

  const handleLongPress = (localX: number, localY: number) => {
    setMenuPoint(toWorkspacePoint(localX, localY));
    setMenuMode("tools");
  };

  const addMark = (kind: MarkKind, text?: string) => {
    setMarks((current) => [
      ...current,
      { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, kind, x: menuPoint.x, y: menuPoint.y, text },
    ]);
    setMenuMode(null);
    setNoteText("");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background" safeAreaClassName="bg-background">
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.title}>Juq 360</Text>
          <Text style={styles.subtitle}>짧게 터치해 각도 측정 · 길게 터치해 표시 추가</Text>
        </View>

        <View style={[styles.workspace, { width: workspaceSize, height: workspaceSize }]}>
          <GridBackground />
          <ProtractorOverlay
            center={centerForWorkspace}
            size={protractorSize}
            selectedAngle={selectedAngle}
            onScaleStart={handleScaleStart}
            onScale={handleScale}
            onTap={handleTap}
            onLongPress={handleLongPress}
          />
          <AnnotationLayer marks={marks} />
          <View pointerEvents="none" style={styles.statusBadge}>
            <Text style={styles.statusText}>{selectedAngle === null ? `${Math.round(scale * 100)}%` : `${Math.round(selectedAngle)}°`}</Text>
          </View>
        </View>

        <View style={styles.gestureGuide}>
          <View style={styles.guideItem}><Text style={styles.guideIcon}>●</Text><Text style={styles.guideText}>짧게 터치: 각도</Text></View>
          <View style={styles.guideDivider} />
          <View style={styles.guideItem}><Text style={styles.guideIcon}>✥</Text><Text style={styles.guideText}>길게 터치: 메뉴</Text></View>
          <View style={styles.guideDivider} />
          <View style={styles.guideItem}><Text style={styles.guideIcon}>⇆</Text><Text style={styles.guideText}>두 손가락: 확대</Text></View>
        </View>
      </View>

      <Modal visible={menuMode !== null} transparent animationType="slide" onRequestClose={() => setMenuMode(null)}>
        <Pressable onPress={() => setMenuMode(null)} style={styles.modalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {menuMode === "tools" ? (
              <View>
                <Text style={styles.sheetTitle}>표시 추가</Text>
                <Text style={styles.sheetDescription}>길게 누른 위치에 표시를 배치합니다.</Text>
                <Pressable onPress={() => setMenuMode("note")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>메모 작성</Text></Pressable>
                <Pressable onPress={() => addMark("rectangle")} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>사각형 그리기</Text></Pressable>
                <Pressable onPress={() => addMark("circle")} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>원형 그리기</Text></Pressable>
              </View>
            ) : null}
            {menuMode === "note" ? (
              <View>
                <Text style={styles.sheetTitle}>메모 작성</Text>
                <Text style={styles.sheetDescription}>표시할 내용을 입력한 뒤 작업면에 추가하세요.</Text>
                <TextInput value={noteText} onChangeText={setNoteText} placeholder="예: 모서리 각도 확인" placeholderTextColor="#7A8A99" multiline autoFocus maxLength={80} style={styles.noteInput} />
                <Pressable onPress={() => addMark("note", noteText.trim() || "메모")} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><Text style={styles.primaryButtonText}>메모 추가</Text></Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "space-between", backgroundColor: INK, paddingHorizontal: 16, paddingVertical: 12 },
  header: { width: "100%", alignItems: "center", paddingTop: 4 },
  title: { color: PAPER, fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.6 },
  subtitle: { color: "rgba(247,250,252,0.62)", fontSize: 11, fontWeight: "700", marginTop: 2, textAlign: "center" },
  workspace: { position: "relative", overflow: "hidden", borderRadius: 28, backgroundColor: "#152F42", borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  grid: { position: "absolute" },
  statusBadge: { position: "absolute", left: 12, bottom: 12, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(13,27,42,0.72)" },
  statusText: { color: PAPER, fontSize: 12, fontWeight: "800" },
  gestureGuide: { width: "100%", minHeight: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-around", borderRadius: 18, borderWidth: 1, borderColor: "rgba(247,250,252,0.16)", backgroundColor: "rgba(247,250,252,0.08)", paddingHorizontal: 6 },
  guideItem: { flex: 1, alignItems: "center", justifyContent: "center" },
  guideIcon: { color: "#00C2D1", fontSize: 16, lineHeight: 19, fontWeight: "800" },
  guideText: { color: PAPER, marginTop: 3, fontSize: 10, fontWeight: "700", textAlign: "center" },
  guideDivider: { height: 30, width: 1, backgroundColor: "rgba(247,250,252,0.18)" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
  sheet: { backgroundColor: PAPER, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingBottom: 28, paddingTop: 10 },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: "#C9D2D8", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { color: INK, fontSize: 24, lineHeight: 30, fontWeight: "800", letterSpacing: -0.4 },
  sheetDescription: { color: "#7A8A99", fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 18 },
  primaryButton: { minHeight: 52, borderRadius: 15, backgroundColor: INK, alignItems: "center", justifyContent: "center", marginTop: 10 },
  primaryButtonText: { color: PAPER, fontSize: 16, fontWeight: "800" },
  secondaryButton: { minHeight: 52, borderRadius: 15, borderWidth: 1.5, borderColor: "#D4DEE4", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondaryButtonText: { color: INK, fontSize: 15, fontWeight: "800" },
  noteInput: { minHeight: 96, maxHeight: 130, borderRadius: 14, borderWidth: 1.5, borderColor: "#D4DEE4", backgroundColor: "#FFFFFF", color: INK, fontSize: 16, lineHeight: 22, paddingHorizontal: 14, paddingVertical: 12, textAlignVertical: "top" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
