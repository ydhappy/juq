import { useMemo, useRef } from "react";
import { PanResponder, Pressable, StyleSheet, Text, View } from "react-native";

import type { WorkspaceAnnotation } from "@/lib/workspace";

const CYAN = "#00C2D1";
const ORANGE = "#FF9F1C";
const PAPER = "#F7FAFC";

interface AnnotationLayerProps {
  annotations: WorkspaceAnnotation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

interface AnnotationItemProps {
  annotation: WorkspaceAnnotation;
  selected: boolean;
  onSelect: (id: string) => void;
  onMove: (id: string, x: number, y: number) => void;
}

function AnnotationItem({ annotation, selected, onSelect, onMove }: AnnotationItemProps) {
  const origin = useRef({ x: annotation.x, y: annotation.y });
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 1 || Math.abs(gesture.dy) > 1,
        onPanResponderGrant: () => {
          origin.current = { x: annotation.x, y: annotation.y };
          onSelect(annotation.id);
        },
        onPanResponderMove: (_, gesture) => {
          onMove(annotation.id, origin.current.x + gesture.dx, origin.current.y + gesture.dy);
        },
      }),
    [annotation.id, annotation.x, annotation.y, onMove, onSelect],
  );

  const commonStyle = [styles.item, { left: annotation.x, top: annotation.y }, selected && styles.selected];

  if (annotation.kind === "note") {
    return (
      <Pressable {...panResponder.panHandlers} onPress={() => onSelect(annotation.id)} style={({ pressed }) => [commonStyle, styles.note, pressed && styles.pressed]}>
        <Text style={styles.noteText}>{annotation.text || "메모"}</Text>
      </Pressable>
    );
  }

  return <View {...panResponder.panHandlers} style={[commonStyle, annotation.kind === "circle" ? styles.circle : styles.rectangle]} />;
}

export function AnnotationLayer({ annotations, selectedId, onSelect, onMove }: AnnotationLayerProps) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {annotations.map((annotation) => (
        <AnnotationItem
          key={annotation.id}
          annotation={annotation}
          selected={annotation.id === selectedId}
          onSelect={onSelect}
          onMove={onMove}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { position: "absolute" },
  rectangle: { width: 92, height: 62, borderWidth: 3, borderColor: CYAN, backgroundColor: "rgba(0,194,209,0.10)", borderRadius: 5 },
  circle: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: ORANGE, backgroundColor: "rgba(255,159,28,0.10)" },
  note: { maxWidth: 156, minHeight: 34, borderRadius: 8, backgroundColor: PAPER, paddingHorizontal: 10, paddingVertical: 8, shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  noteText: { color: "#0D1B2A", fontSize: 13, lineHeight: 17, fontWeight: "700" },
  selected: { borderColor: PAPER, shadowColor: PAPER, shadowOpacity: 0.9, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  pressed: { opacity: 0.8 },
});
