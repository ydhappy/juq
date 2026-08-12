import * as MediaLibrary from "expo-media-library";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useRef, useState } from "react";
import { Alert, BackHandler, Modal, PanResponder, Platform, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { captureRef } from "react-native-view-shot";

import { AnnotationLayer, type Mark, type MarkKind } from "@/components/annotation-layer";
import { ProtractorOverlay } from "@/components/protractor-overlay";
import { ScreenContainer } from "@/components/screen-container";
import { clampNumber, scaleFromPinch, workspacePointToAngle } from "@/lib/protractor-math";

type Center = { x: number; y: number };
type MenuMode = "tools" | "note" | null;

const INK = "#0D1B2A";
const PAPER = "#F7FAFC";
const LONG_PRESS_MS = 430;

function touchDistance(touches: readonly { pageX: number; pageY: number }[]) {
  if (touches.length < 2) return 0;
  const [first, second] = touches;
  return Math.hypot(first.pageX - second.pageX, first.pageY - second.pageY);
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const workspaceSize = Math.max(300, Math.min(width - 24, height - 218, 560));
  const [scale, setScale] = useState(0.92);
  const [center, setCenter] = useState<Center>({ x: workspaceSize / 2, y: workspaceSize / 2 });
  const [selectedAngle, setSelectedAngle] = useState<number | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [overlayLocked, setOverlayLocked] = useState(false);
  const [menuMode, setMenuMode] = useState<MenuMode>(null);
  const [menuPoint, setMenuPoint] = useState<Center>({ x: workspaceSize / 2, y: workspaceSize / 2 });
  const [noteText, setNoteText] = useState("");
  const [marks, setMarks] = useState<Mark[]>([]);
  const [isSavingCapture, setIsSavingCapture] = useState(false);
  const moveOrigin = useRef<Center>(center);
  const pinchOriginScale = useRef(scale);
  const gestureStart = useRef<Center>({ x: 0, y: 0 });
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);
  const didMove = useRef(false);
  const didPinch = useRef(false);
  const pinchStartDistance = useRef(0);
  const workspaceRef = useRef<View>(null);
  const protractorSize = workspaceSize * scale;
  const centerForWorkspace = useMemo(
    () => ({
      x: clampNumber(center.x, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
      y: clampNumber(center.y, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
    }),
    [center, protractorSize, workspaceSize],
  );

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const measureAtWorkspacePoint = useCallback((x: number, y: number) => {
    if (!overlayVisible) return;
    setSelectedAngle(workspacePointToAngle(x, y, centerForWorkspace.x, centerForWorkspace.y));
  }, [centerForWorkspace.x, centerForWorkspace.y, overlayVisible]);

  const showMenuAt = useCallback((x: number, y: number) => {
    setMenuPoint({ x: clampNumber(x, 10, workspaceSize - 10), y: clampNumber(y, 10, workspaceSize - 10) });
    setMenuMode("tools");
  }, [workspaceSize]);

  const workspacePanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          const firstTouch = event.nativeEvent.touches[0];
          gestureStart.current = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY };
          didLongPress.current = false;
          didMove.current = false;
          didPinch.current = false;
          const initialDistance = touchDistance(event.nativeEvent.touches);
          pinchStartDistance.current = initialDistance;
          if (initialDistance > 0) {
            didPinch.current = true;
            pinchOriginScale.current = scale;
            return;
          }
          clearLongPress();
          longPressTimer.current = setTimeout(() => {
            if (!didMove.current && !didPinch.current) {
              didLongPress.current = true;
              showMenuAt(gestureStart.current.x, gestureStart.current.y);
            }
          }, LONG_PRESS_MS);
          if (!firstTouch) clearLongPress();
        },
        onPanResponderMove: (event, gesture) => {
          const currentDistance = touchDistance(event.nativeEvent.touches);
          if (currentDistance > 0) {
            clearLongPress();
            didPinch.current = true;
            if (overlayLocked) return;
            if (pinchStartDistance.current === 0) {
              pinchStartDistance.current = currentDistance;
              pinchOriginScale.current = scale;
              return;
            }
            setScale(scaleFromPinch(pinchOriginScale.current, pinchStartDistance.current, currentDistance));
            return;
          }
          if (Math.abs(gesture.dx) > 5 || Math.abs(gesture.dy) > 5) {
            clearLongPress();
            if (!didMove.current && !overlayLocked) {
              didMove.current = true;
              moveOrigin.current = centerForWorkspace;
            }
          }
          if (didMove.current && overlayVisible && !overlayLocked) {
            setCenter({
              x: clampNumber(moveOrigin.current.x + gesture.dx, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
              y: clampNumber(moveOrigin.current.y + gesture.dy, protractorSize * 0.24, workspaceSize - protractorSize * 0.24),
            });
          }
        },
        onPanResponderRelease: (event, gesture) => {
          clearLongPress();
          if (!didLongPress.current && !didMove.current && !didPinch.current && Math.abs(gesture.dx) < 5 && Math.abs(gesture.dy) < 5) {
            measureAtWorkspacePoint(event.nativeEvent.locationX, event.nativeEvent.locationY);
          }
          didMove.current = false;
          didPinch.current = false;
          pinchStartDistance.current = 0;
        },
        onPanResponderTerminate: () => {
          clearLongPress();
          didMove.current = false;
          didPinch.current = false;
          pinchStartDistance.current = 0;
        },
      }),
    [centerForWorkspace, measureAtWorkspacePoint, overlayLocked, overlayVisible, protractorSize, scale, showMenuAt, workspaceSize],
  );

  const addMark = (kind: MarkKind, text?: string) => {
    setMarks((current) => [...current, { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, kind, x: menuPoint.x, y: menuPoint.y, text }]);
    setMenuMode(null);
    setNoteText("");
  };

  const placeOverlayAtCenter = () => {
    setCenter({ x: workspaceSize / 2, y: workspaceSize / 2 });
    setOverlayVisible(true);
    setOverlayLocked(false);
    setSelectedAngle(null);
    setMenuMode(null);
  };

  const removeOverlay = () => {
    setOverlayVisible(false);
    setOverlayLocked(false);
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
          {overlayLocked ? <View style={styles.lockBadge}><Text style={styles.lockBadgeText}>오버레이 잠금</Text></View> : null}
        </View>

        <View ref={workspaceRef} collapsable={false} {...workspacePanResponder.panHandlers} style={[styles.workspace, { width: workspaceSize, height: workspaceSize }]}>
          {overlayVisible ? <ProtractorOverlay center={centerForWorkspace} size={protractorSize} selectedAngle={selectedAngle} /> : null}
          <AnnotationLayer marks={marks} />
        </View>

        <Text style={styles.gestureHint}>{overlayVisible ? overlayLocked ? "잠금됨: 측정만 가능 · 길게 터치해 해제" : "화면 어디든 터치: 각도 · 드래그: 이동 · 두 손가락: 확대 · 길게 터치: 메뉴" : "오버레이가 삭제되었습니다. 길게 터치해 메뉴에서 표시하세요."}</Text>
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
                  <Pressable onPress={() => { setOverlayLocked((current) => !current); setMenuMode(null); }} style={({ pressed }) => [styles.menuAction, overlayLocked && styles.lockAction, pressed && styles.pressed]}><Text style={[styles.menuActionText, overlayLocked && styles.lockActionText]}>{overlayLocked ? "잠금 해제" : "오버레이 잠금"}</Text></Pressable>
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
  lockBadge: { borderRadius: 9, backgroundColor: "rgba(255,159,28,0.20)", borderWidth: 1, borderColor: "rgba(255,159,28,0.72)", marginTop: 3, paddingHorizontal: 8, paddingVertical: 3 },
  lockBadgeText: { color: "#FFB84D", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
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
  lockAction: { borderColor: "#E1AC50", backgroundColor: "#FFF7E8" },
  lockActionText: { color: "#9C6100" },
  noteInput: { minHeight: 68, maxHeight: 92, borderRadius: 10, borderWidth: 1, borderColor: "#D4DEE4", backgroundColor: "#FFFFFF", color: INK, fontSize: 14, lineHeight: 19, paddingHorizontal: 10, paddingVertical: 8, textAlignVertical: "top" },
  saveNoteButton: { minHeight: 38, borderRadius: 10, backgroundColor: INK, alignItems: "center", justifyContent: "center", marginTop: 8 },
  saveNoteText: { color: PAPER, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
