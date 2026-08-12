import * as MediaLibrary from "expo-media-library";
import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import { Alert, BackHandler, Modal, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { AnnotationLayer, type Mark, type MarkKind } from "@/components/annotation-layer";
import { ProtractorOverlay } from "@/components/protractor-overlay";
import { ScreenContainer } from "@/components/screen-container";
import { clampNumber, scaleFromPinch, workspacePointToAngle } from "@/lib/protractor-math";

type Center = { x: number; y: number };
type MenuMode = "tools" | "note" | null;

const INK = "#0D1B2A";
const PAPER = "#F7FAFC";

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const workspaceSize = Math.max(300, Math.min(width - 24, height - 218, 560));
  const [scale, setScale] = useState(0.92);
  const [center, setCenter] = useState<Center>({ x: workspaceSize / 2, y: workspaceSize / 2 });
  const [selectedAngle, setSelectedAngle] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [menuMode, setMenuMode] = useState<MenuMode>(null);
  const [menuPoint, setMenuPoint] = useState<Center>({ x: workspaceSize / 2, y: workspaceSize / 2 });
  const [noteText, setNoteText] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [isSavingCapture, setIsSavingCapture] = useState(false);
  const moveOrigin = useRef<Center>(center);
  const pinchOriginScale = useRef(scale);
  const workspaceRef = useRef<View>(null);
  const protractorSize = workspaceSize * scale;
  const centerForWorkspace = useMemo(
    () => ({
      x: clampNumber(center.x, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
      y: clampNumber(center.y, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
    }),
    [center, protractorSize, workspaceSize],
  );

  const measureAtWorkspacePoint = (x: number, y: number) => {
    setSelectedAngle(workspacePointToAngle(x, y, centerForWorkspace.x, centerForWorkspace.y));
  };

  const handleOverlayTap = (localX: number, localY: number) => {
    measureAtWorkspacePoint(centerForWorkspace.x - protractorSize / 2 + localX, centerForWorkspace.y - protractorSize / 2 + localY);
  };

  const handleMoveStart = () => {
    moveOrigin.current = centerForWorkspace;
  };

  const handleMove = (dx: number, dy: number) => {
    setCenter({
      x: clampNumber(moveOrigin.current.x + dx, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
      y: clampNumber(moveOrigin.current.y + dy, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
    });
  };

  const handleScaleStart = () => {
    pinchOriginScale.current = scale;
  };

  const handleScale = (startDistance: number, currentDistance: number) => {
    setScale(scaleFromPinch(pinchOriginScale.current, startDistance, currentDistance));
  };

  const handleLongPress = (localX: number, localY: number) => {
    setMenuPoint({
      x: clampNumber(centerForWorkspace.x - protractorSize / 2 + localX, 10, workspaceSize - 10),
      y: clampNumber(centerForWorkspace.y - protractorSize / 2 + localY, 10, workspaceSize - 10),
    });
    setMenuMode("tools");
  };

  const addMark = (kind: MarkKind, text?: string) => {
    setMarks((current) => [...current, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, kind, x: menuPoint.x, y: menuPoint.y, text }]);
    setMenuMode(null);
    setNoteText("");
  };

  const placeOverlayAtCenter = () => {
    setCenter({ x: workspaceSize / 2, y: workspaceSize / 2 });
    setOverlayVisible(true);
    setSelectedAngle(null);
    setMenuMode(null);
  };

  const removeOverlay = () => {
    setOverlayVisible(false);
    setSelectedAngle(null);
    setMenuMode(null);
  };

  const saveCapture = async () => {
    if (Platform.OS === "web") {
      Alert.alert("모바일 기기에서 지원", "캡처 저장은 Android 또는 iOS 기기에서 사용할 수 있습니다.");
      return;
    }
    if (!workspaceRef.current || isSavingCapture) return;
    setIsSavingCapture(true);
    try {
      const permission = await MediaLibrary.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("사진 권한 필요", "캡처 이미지를 기기에 저장하려면 사진 보관함 권한을 허용해 주세요.");
        return;
      }
      const uri = await captureRef(workspaceRef, { format: "png", quality: 1, result: "tmpfile" });
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert("캡처 저장 완료", "현재 각도기 오버레이를 사진 보관함에 저장했습니다.");
      setMenuMode(null);
    } catch {
      Alert.alert("캡처 실패", "저장 중 문제가 발생했습니다. 권한과 저장 공간을 확인해 주세요.");
    } finally {
      setIsSavingCapture(false);
    }
  };

  const closeApp = () => {
    setMenuMode(null);
    if (Platform.OS === "android") {
      BackHandler.exitApp();
      return;
    }
    Alert.alert("앱 종료", "iOS에서는 운영체제 정책상 앱을 직접 종료할 수 없습니다. 홈 화면으로 이동해 주세요.");
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background" safeAreaClassName="bg-background">
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <Text style={styles.brand}>Juq 360</Text>
          <Text style={styles.measureLabel}>측정 각도</Text>
          <Text style={styles.measureValue}>{selectedAngle === null ? "—°" : `${Math.round(selectedAngle)}°`}</Text>
        </View>

        <View ref={workspaceRef} collapsable={false} style={[styles.workspace, { width: workspaceSize, height: workspaceSize }]}>
          <Pressable
            onPress={(event) => measureAtWorkspacePoint(event.nativeEvent.locationX, event.nativeEvent.locationY)}
            onLongPress={(event) => { setMenuPoint({ x: event.nativeEvent.locationX, y: event.nativeEvent.locationY }); setMenuMode("tools"); }}
            delayLongPress={430}
            style={StyleSheet.absoluteFill}
          />
          {overlayVisible ? (
            <ProtractorOverlay
              center={centerForWorkspace}
              size={protractorSize}
              selectedAngle={selectedAngle}
              onMoveStart={handleMoveStart}
              onMove={handleMove}
              onScaleStart={handleScaleStart}
              onScale={handleScale}
              onTap={handleOverlayTap}
              onLongPress={handleLongPress}
            />
          ) : null}
          <AnnotationLayer marks={marks} />
        </View>

        <Text style={styles.gestureHint}>{overlayVisible ? "화면 터치: 각도 · 드래그: 이동 · 두 손가락: 확대 · 길게 터치: 메뉴" : "오버레이가 삭제되었습니다. 길게 터치해 메뉴에서 표시하세요."}</Text>
      </View>

      <Modal visible={menuMode !== null} transparent animationType="fade" onRequestClose={() => setMenuMode(null)}>
        <Pressable onPress={() => setMenuMode(null)} style={styles.modalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.menuCard}>
            {menuMode === "tools" ? (
              <View>
                <Text style={styles.menuTitle}>표시</Text>
                <View style={styles.menuRow}>
                  <Pressable onPress={() => setMenuMode("note")} style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}><Text style={styles.menuActionText}>메모</Text></Pressable>
                  <Pressable onPress={() => addMark("rectangle")} style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}><Text style={styles.menuActionText}>사각형</Text></Pressable>
                  <Pressable onPress={() => addMark("circle")} style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}><Text style={styles.menuActionText}>원형</Text></Pressable>
                </View>
                <View style={styles.menuRow}>
                  <Pressable onPress={() => void saveCapture()} style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}><Text style={styles.menuActionText}>{isSavingCapture ? "저장 중" : "캡처"}</Text></Pressable>
                  <Pressable onPress={placeOverlayAtCenter} style={({ pressed }) => [styles.menuAction, pressed && styles.pressed]}><Text style={styles.menuActionText}>가운데</Text></Pressable>
                  <Pressable onPress={overlayVisible ? removeOverlay : placeOverlayAtCenter} style={({ pressed }) => [styles.menuAction, styles.exitAction, pressed && styles.pressed]}><Text style={[styles.menuActionText, styles.exitActionText]}>{overlayVisible ? "삭제" : "표시"}</Text></Pressable>
                </View>
                <View style={styles.menuRow}>
                  <Pressable onPress={closeApp} style={({ pressed }) => [styles.menuAction, styles.exitAction, pressed && styles.pressed]}><Text style={[styles.menuActionText, styles.exitActionText]}>앱 끄기</Text></Pressable>
                </View>
              </View>
            ) : null}
            {menuMode === "note" ? (
              <View>
                <Text style={styles.menuTitle}>메모</Text>
                <TextInput value={noteText} onChangeText={setNoteText} placeholder="텍스트 입력" placeholderTextColor="#7A8A99" multiline autoFocus maxLength={80} style={styles.noteInput} />
                <Pressable onPress={() => addMark("note", noteText.trim() || "메모")} style={({ pressed }) => [styles.saveNoteButton, pressed && styles.pressed]}><Text style={styles.saveNoteText}>추가</Text></Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "space-between", backgroundColor: INK, paddingHorizontal: 12, paddingVertical: 8 },
  header: { width: "100%", alignItems: "center", paddingTop: 2 },
  brand: { color: "rgba(247,250,252,0.66)", fontSize: 13, fontWeight: "800", letterSpacing: 1.1 },
  measureLabel: { color: "rgba(247,250,252,0.68)", fontSize: 12, fontWeight: "700", marginTop: 7, letterSpacing: 0.6 },
  measureValue: { color: PAPER, fontSize: 54, lineHeight: 61, fontWeight: "800", letterSpacing: -1.8 },
  workspace: { position: "relative", overflow: "visible", backgroundColor: "transparent" },
  gestureHint: { color: "rgba(247,250,252,0.72)", fontSize: 10, lineHeight: 14, fontWeight: "700", textAlign: "center", paddingHorizontal: 12 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", alignItems: "center", backgroundColor: "rgba(0,0,0,0.20)", paddingBottom: 28 },
  menuCard: { width: "76%", maxWidth: 280, borderRadius: 16, backgroundColor: "rgba(247,250,252,0.98)", padding: 10, shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 8 },
  menuTitle: { color: INK, fontSize: 14, fontWeight: "800", marginBottom: 8, textAlign: "center" },
  menuRow: { flexDirection: "row", gap: 7, marginTop: 7 },
  menuAction: { flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, borderColor: "#D4DEE4", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  menuActionText: { color: INK, fontSize: 12, fontWeight: "800" },
  exitAction: { borderColor: "#F3B5B1", backgroundColor: "#FFF5F4" },
  exitActionText: { color: "#C83E37" },
  noteInput: { minHeight: 68, maxHeight: 92, borderRadius: 10, borderWidth: 1, borderColor: "#D4DEE4", backgroundColor: "#FFFFFF", color: INK, fontSize: 14, lineHeight: 19, paddingHorizontal: 10, paddingVertical: 8, textAlignVertical: "top" },
  saveNoteButton: { minHeight: 38, borderRadius: 10, backgroundColor: INK, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveNoteText: { color: PAPER, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
