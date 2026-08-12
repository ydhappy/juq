import { StyleSheet, Text, View } from "react-native";

export type MarkKind = "note" | "rectangle" | "circle";

export interface Mark {
  id: string;
  kind: MarkKind;
  x: number;
  y: number;
  text?: string;
}

interface AnnotationLayerProps {
  marks: Mark[];
}

export function AnnotationLayer({ marks }: AnnotationLayerProps) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.nonInteractive]}>
      {marks.map((mark) => {
        if (mark.kind === "note") {
          return (
            <View key={mark.id} style={[styles.note, { left: mark.x, top: mark.y }]}>
              <Text style={styles.noteText}>{mark.text || "메모"}</Text>
            </View>
          );
        }
        return <View key={mark.id} style={[styles.shape, mark.kind === "circle" ? styles.circle : styles.rectangle, { left: mark.x, top: mark.y }]} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nonInteractive: { pointerEvents: "none" },
  shape: { position: "absolute", borderWidth: 3 },
  rectangle: { width: 92, height: 62, borderRadius: 6, borderColor: "#00C2D1", backgroundColor: "rgba(0,194,209,0.10)" },
  circle: { width: 72, height: 72, borderRadius: 36, borderColor: "#FF9F1C", backgroundColor: "rgba(255,159,28,0.10)" },
  note: { position: "absolute", maxWidth: 156, minHeight: 34, borderRadius: 8, backgroundColor: "#F7FAFC", paddingHorizontal: 10, paddingVertical: 8, shadowColor: "#000000", shadowOpacity: 0.22, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  noteText: { color: "#0D1B2A", fontSize: 13, lineHeight: 17, fontWeight: "700" },
});
