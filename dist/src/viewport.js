export function landscapeViewport(width, height, insets = { top: 0, right: 0, bottom: 0, left: 0 }) {
    const usableWidth = Math.max(0, width - insets.left - insets.right), usableHeight = Math.max(0, height - insets.top - insets.bottom);
    const rotated = usableHeight > usableWidth;
    return { rotated, width: rotated ? usableHeight : usableWidth, height: rotated ? usableWidth : usableHeight, left: insets.left, top: insets.top };
}
/** Inverse of the frame's clockwise quarter turn, including viewport/safe-area offset. */
export function framePoint(client, frame, rotated) {
    return rotated ? { x: client.y - frame.top, y: frame.width - (client.x - frame.left) } : { x: client.x - frame.left, y: client.y - frame.top };
}
