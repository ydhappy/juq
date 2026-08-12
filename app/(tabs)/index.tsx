import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Line, Path } from "react-native-svg";

import { ProtractorOverlay } from "@/components/protractor-overlay";
import { ScreenContainer } from "@/components/screen-container";
import { angleDifference, clampNumber, snapAngle, wrapAngle } from "@/lib/protractor-math";

type SheetName = "background" | "controls" | "help" | null;
type Center = { x: number; y: number };

const INK = "#0D1B2A";
const CYAN = "#00C2D1";
const ORANGE = "#FF9F1C";
const PAPER = "#F7FAFC";
const SLATE = "#7A8A99";

function formatAngle(angle: number) {
  return `${Math.round(wrapAngle(angle))}°`;
}

function triggerHaptic() {
  if (Platform.OS !== "web") {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

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

interface UtilityButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  active?: boolean;
}

function UtilityButton({ icon, label, onPress, active = false }: UtilityButtonProps) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.utilityButton, active && styles.utilityButtonActive, pressed && styles.pressed]}>
      <Text style={[styles.utilityIcon, active && styles.utilityIconActive]}>{icon}</Text>
      <Text style={[styles.utilityLabel, active && styles.utilityLabelActive]}>{label}</Text>
    </Pressable>
  );
}

interface StepperProps {
  label: string;
  value: number;
  tint: string;
  step: number;
  onChange: (direction: number) => void;
}

function AngleStepper({ label, value, tint, step, onChange }: StepperProps) {
  return (
    <View style={styles.stepperRow}>
      <View style={styles.stepperLabelBlock}>
        <View style={[styles.legendDot, { backgroundColor: tint }]} />
        <View>
          <Text style={styles.stepperLabel}>{label}</Text>
          <Text style={styles.stepperValue}>{formatAngle(value)}</Text>
        </View>
      </View>
      <View style={styles.stepperActions}>
        <Pressable onPress={() => onChange(-1)} style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
          <Text style={styles.stepperSymbol}>−</Text>
        </Pressable>
        <Text style={styles.stepperHint}>{step}°</Text>
        <Pressable onPress={() => onChange(1)} style={({ pressed }) => [styles.stepperButton, pressed && styles.pressed]}>
          <Text style={styles.stepperSymbol}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const canvasSize = Math.min(width - 32, 430);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetName>(null);
  const [baseAngle, setBaseAngle] = useState(0);
  const [measureAngle, setMeasureAngle] = useState(44);
  const [snapStep, setSnapStep] = useState(1);
  const [opacity, setOpacity] = useState(88);
  const [scale, setScale] = useState(0.94);
  const [center, setCenter] = useState<Center>({ x: canvasSize / 2, y: canvasSize / 2 });
  const moveOrigin = useRef<Center>(center);

  const overlaySize = canvasSize * scale;
  const measuredDifference = angleDifference(baseAngle, measureAngle);
  const centerForCanvas = useMemo(
    () => ({
      x: clampNumber(center.x, overlaySize * 0.31, canvasSize - overlaySize * 0.31),
      y: clampNumber(center.y, overlaySize * 0.31, canvasSize - overlaySize * 0.31),
    }),
    [canvasSize, center, overlaySize],
  );

  const updateAngle = (setter: (value: number) => void, currentValue: number, direction: number) => {
    triggerHaptic();
    setter(snapAngle(currentValue, direction, snapStep));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 1 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setSheet(null);
      triggerHaptic();
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") {
      Alert.alert("카메라 권한 필요", "새 사진 위에서 각도를 측정하려면 카메라 접근을 허용해 주세요.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setSheet(null);
      triggerHaptic();
    }
  };

  const clearBackground = () => {
    setImageUri(null);
    setSheet(null);
    triggerHaptic();
  };

  const resetMeasurement = () => {
    setBaseAngle(0);
    setMeasureAngle(44);
    setScale(0.94);
    setCenter({ x: canvasSize / 2, y: canvasSize / 2 });
    setSheet(null);
    triggerHaptic();
  };

  const increaseScale = (direction: number) => {
    setScale((current) => clampNumber(Number((current + direction * 0.06).toFixed(2)), 0.7, 1.08));
    triggerHaptic();
  };

  const handleMoveStart = () => {
    moveOrigin.current = centerForCanvas;
  };

  const handleMove = (dx: number, dy: number) => {
    setCenter({
      x: clampNumber(moveOrigin.current.x + dx, overlaySize * 0.31, canvasSize - overlaySize * 0.31),
      y: clampNumber(moveOrigin.current.y + dy, overlaySize * 0.31, canvasSize - overlaySize * 0.31),
    });
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-background" safeAreaClassName="bg-background">
      <StatusBar style="light" />
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>정밀 측정 도구</Text>
            <Text style={styles.title}>Juq 360</Text>
          </View>
          <Pressable onPress={() => setSheet("help")} hitSlop={8} style={({ pressed }) => [styles.helpButton, pressed && styles.pressed]}>
            <Text style={styles.helpButtonText}>?</Text>
          </Pressable>
        </View>

        <View style={styles.measurementCard}>
          <View>
            <Text style={styles.measurementLabel}>현재 각도</Text>
            <Text style={styles.measurementValue}>{formatAngle(measuredDifference)}</Text>
          </View>
          <View style={styles.measurementMeta}>
            <Text style={styles.measurementMetaText}>기준 {formatAngle(baseAngle)}</Text>
            <Text style={styles.measurementMetaText}>측정 {formatAngle(measureAngle)}</Text>
          </View>
        </View>

        <View style={[styles.canvasFrame, { width: canvasSize, height: canvasSize }]}>
          {imageUri ? <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.backgroundImage} /> : <GridBackground />}
          <View style={styles.canvasShade} />
          <ProtractorOverlay
            center={centerForCanvas}
            size={overlaySize}
            baseAngle={baseAngle}
            measureAngle={measureAngle}
            opacity={opacity / 100}
            onMoveStart={handleMoveStart}
            onMove={handleMove}
          />
          <View pointerEvents="none" style={styles.moveHint}>
            <Text style={styles.moveHintText}>각도기를 끌어 위치를 조정</Text>
          </View>
        </View>

        <View style={styles.quickControls}>
          <Pressable onPress={() => increaseScale(-1)} style={({ pressed }) => [styles.scaleButton, pressed && styles.pressed]}>
            <Text style={styles.scaleSymbol}>−</Text>
          </Pressable>
          <View style={styles.scaleReadout}>
            <Text style={styles.scaleLabel}>크기</Text>
            <Text style={styles.scaleValue}>{Math.round(scale * 100)}%</Text>
          </View>
          <Pressable onPress={() => increaseScale(1)} style={({ pressed }) => [styles.scaleButton, pressed && styles.pressed]}>
            <Text style={styles.scaleSymbol}>+</Text>
          </Pressable>
        </View>

        <View style={styles.utilityRow}>
          <UtilityButton icon="▣" label="배경" onPress={() => setSheet("background")} active={Boolean(imageUri)} />
          <UtilityButton icon="◒" label="각도" onPress={() => setSheet("controls")} />
          <UtilityButton icon="↺" label="초기화" onPress={resetMeasurement} />
        </View>
      </View>

      <Modal visible={sheet !== null} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
        <Pressable onPress={() => setSheet(null)} style={styles.modalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
            <View style={styles.sheetHandle} />
            {sheet === "background" ? (
              <View>
                <Text style={styles.sheetTitle}>측정 배경</Text>
                <Text style={styles.sheetDescription}>사진 위에 투명 각도기를 올려 대상의 방향을 맞춰 보세요.</Text>
                <Pressable onPress={takePhoto} style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}>
                  <Text style={styles.primarySheetButtonText}>카메라로 촬영</Text>
                </Pressable>
                <Pressable onPress={pickImage} style={({ pressed }) => [styles.secondarySheetButton, pressed && styles.pressed]}>
                  <Text style={styles.secondarySheetButtonText}>사진 보관함에서 선택</Text>
                </Pressable>
                <Pressable onPress={clearBackground} style={({ pressed }) => [styles.textSheetButton, pressed && styles.pressed]}>
                  <Text style={styles.textSheetButtonText}>빈 작업면 사용</Text>
                </Pressable>
              </View>
            ) : null}

            {sheet === "controls" ? (
              <View>
                <Text style={styles.sheetTitle}>각도 조절</Text>
                <Text style={styles.sheetDescription}>선의 끝점을 목표 선에 맞추고, 필요한 경우 작은 단위로 보정하세요.</Text>
                <AngleStepper label="기준선" value={baseAngle} tint={CYAN} step={snapStep} onChange={(direction) => updateAngle(setBaseAngle, baseAngle, direction)} />
                <AngleStepper label="측정선" value={measureAngle} tint={ORANGE} step={snapStep} onChange={(direction) => updateAngle(setMeasureAngle, measureAngle, direction)} />
                <Text style={styles.controlHeading}>스냅 단위</Text>
                <View style={styles.segmentedRow}>
                  {[1, 5, 10].map((value) => (
                    <Pressable key={value} onPress={() => { setSnapStep(value); triggerHaptic(); }} style={({ pressed }) => [styles.segmentButton, snapStep === value && styles.segmentButtonActive, pressed && styles.pressed]}>
                      <Text style={[styles.segmentText, snapStep === value && styles.segmentTextActive]}>{value}°</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.controlHeading}>각도기 불투명도</Text>
                <View style={styles.segmentedRow}>
                  {[55, 72, 88, 100].map((value) => (
                    <Pressable key={value} onPress={() => { setOpacity(value); triggerHaptic(); }} style={({ pressed }) => [styles.segmentButton, opacity === value && styles.segmentButtonActive, pressed && styles.pressed]}>
                      <Text style={[styles.segmentText, opacity === value && styles.segmentTextActive]}>{value}%</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={resetMeasurement} style={({ pressed }) => [styles.secondarySheetButton, styles.resetSheetButton, pressed && styles.pressed]}>
                  <Text style={styles.secondarySheetButtonText}>측정값 초기화</Text>
                </Pressable>
              </View>
            ) : null}

            {sheet === "help" ? (
              <View>
                <Text style={styles.sheetTitle}>Juq 사용 방법</Text>
                <View style={styles.helpItem}>
                  <Text style={styles.helpNumber}>1</Text>
                  <Text style={styles.helpText}>배경에서 사진을 불러오거나 빈 작업면을 선택합니다.</Text>
                </View>
                <View style={styles.helpItem}>
                  <Text style={styles.helpNumber}>2</Text>
                  <Text style={styles.helpText}>원형 각도기를 끌어 측정할 꼭짓점 위로 이동합니다.</Text>
                </View>
                <View style={styles.helpItem}>
                  <Text style={styles.helpNumber}>3</Text>
                  <Text style={styles.helpText}>각도 메뉴에서 시안 기준선과 오렌지 측정선을 조정해 0~360° 값을 읽습니다.</Text>
                </View>
                <Pressable onPress={() => setSheet(null)} style={({ pressed }) => [styles.primarySheetButton, pressed && styles.pressed]}>
                  <Text style={styles.primarySheetButtonText}>측정 시작</Text>
                </Pressable>
              </View>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", backgroundColor: INK, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  header: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  eyebrow: { color: "rgba(247,250,252,0.60)", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, marginBottom: 2 },
  title: { color: PAPER, fontSize: 27, lineHeight: 32, fontWeight: "800", letterSpacing: -0.5 },
  helpButton: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(247,250,252,0.36)", alignItems: "center", justifyContent: "center" },
  helpButtonText: { color: PAPER, fontSize: 18, fontWeight: "800" },
  measurementCard: { width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: PAPER, borderRadius: 18, paddingHorizontal: 18, paddingVertical: 12, marginBottom: 14 },
  measurementLabel: { color: SLATE, fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  measurementValue: { color: INK, fontSize: 32, lineHeight: 38, fontWeight: "800", letterSpacing: -1 },
  measurementMeta: { alignItems: "flex-end", gap: 3 },
  measurementMetaText: { color: SLATE, fontSize: 12, fontWeight: "600" },
  canvasFrame: { backgroundColor: "#152F42", overflow: "hidden", borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.14)", position: "relative", shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  backgroundImage: { width: "100%", height: "100%", position: "absolute" },
  grid: { position: "absolute" },
  canvasShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(13,27,42,0.14)" },
  moveHint: { position: "absolute", left: 12, bottom: 10, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: "rgba(13,27,42,0.68)" },
  moveHintText: { color: "rgba(247,250,252,0.88)", fontSize: 10, fontWeight: "700" },
  quickControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 12, gap: 12 },
  scaleButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(247,250,252,0.14)", borderWidth: 1, borderColor: "rgba(247,250,252,0.19)" },
  scaleSymbol: { color: PAPER, fontSize: 23, fontWeight: "500", lineHeight: 25 },
  scaleReadout: { minWidth: 74, alignItems: "center" },
  scaleLabel: { color: "rgba(247,250,252,0.60)", fontSize: 11, fontWeight: "700" },
  scaleValue: { color: PAPER, fontSize: 16, fontWeight: "800" },
  utilityRow: { width: "100%", marginTop: 12, flexDirection: "row", justifyContent: "space-between", gap: 10 },
  utilityButton: { flex: 1, minHeight: 58, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(247,250,252,0.10)", borderWidth: 1, borderColor: "rgba(247,250,252,0.16)" },
  utilityButtonActive: { backgroundColor: "rgba(0,194,209,0.18)", borderColor: "rgba(0,194,209,0.68)" },
  utilityIcon: { color: PAPER, fontSize: 18, lineHeight: 21, fontWeight: "800" },
  utilityIconActive: { color: CYAN },
  utilityLabel: { color: PAPER, fontSize: 11, fontWeight: "700", marginTop: 2 },
  utilityLabelActive: { color: CYAN },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.42)" },
  sheet: { backgroundColor: PAPER, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 22, paddingBottom: 28, paddingTop: 10 },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: "#C9D2D8", alignSelf: "center", marginBottom: 20 },
  sheetTitle: { color: INK, fontSize: 24, lineHeight: 30, fontWeight: "800", letterSpacing: -0.4 },
  sheetDescription: { color: SLATE, fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 20 },
  primarySheetButton: { minHeight: 52, borderRadius: 15, backgroundColor: INK, alignItems: "center", justifyContent: "center", marginTop: 10 },
  primarySheetButtonText: { color: PAPER, fontSize: 16, fontWeight: "800" },
  secondarySheetButton: { minHeight: 52, borderRadius: 15, borderWidth: 1.5, borderColor: "#D4DEE4", alignItems: "center", justifyContent: "center", marginTop: 10 },
  secondarySheetButtonText: { color: INK, fontSize: 15, fontWeight: "800" },
  textSheetButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 5 },
  textSheetButtonText: { color: SLATE, fontSize: 14, fontWeight: "700" },
  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#E0E7EB" },
  stepperLabelBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  stepperLabel: { color: SLATE, fontSize: 12, fontWeight: "700" },
  stepperValue: { color: INK, fontSize: 23, lineHeight: 27, fontWeight: "800" },
  stepperActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  stepperButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F0F3" },
  stepperSymbol: { color: INK, fontSize: 24, lineHeight: 27, fontWeight: "500" },
  stepperHint: { width: 27, color: SLATE, fontSize: 11, fontWeight: "800", textAlign: "center" },
  controlHeading: { color: INK, fontSize: 13, fontWeight: "800", marginTop: 18, marginBottom: 8 },
  segmentedRow: { flexDirection: "row", gap: 8 },
  segmentButton: { flex: 1, minHeight: 40, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#E8F0F3" },
  segmentButtonActive: { backgroundColor: CYAN },
  segmentText: { color: SLATE, fontSize: 13, fontWeight: "800" },
  segmentTextActive: { color: INK },
  resetSheetButton: { marginTop: 20 },
  helpItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  helpNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: CYAN, color: INK, fontSize: 13, fontWeight: "800", textAlign: "center", lineHeight: 26 },
  helpText: { flex: 1, color: INK, fontSize: 15, lineHeight: 22, paddingTop: 2 },
});
