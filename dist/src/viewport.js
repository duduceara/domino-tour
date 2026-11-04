export function landscapeViewport(width, height, insets = { top: 0, right: 0, bottom: 0, left: 0 }) {
    const usableWidth = Math.max(0, width - insets.left - insets.right), usableHeight = Math.max(0, height - insets.top - insets.bottom);
    const rotated = usableHeight > usableWidth;
    return { rotated, width: rotated ? usableHeight : usableWidth, height: rotated ? usableWidth : usableHeight, left: insets.left, top: insets.top };
}
/** Inverse of the frame's clockwise quarter turn, including viewport/safe-area offset. */
export function framePoint(client, frame, rotated) {
    return rotated ? { x: client.y - frame.top, y: frame.width - (client.x - frame.left) } : { x: client.x - frame.left, y: client.y - frame.top };
}

/** Minimum solver space, fitted uniformly into the measured physical surface.
 * Zero/hidden surfaces defer measurement instead of inventing usable pixels. */
export function fittedTableSpace(width, height) {
    if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
    const scale = Math.min(1, width / 120, height / 120);
    return { width: Math.max(120, width / scale), height: Math.max(120, height / scale), scale };
}
export function tablePoint(point, physical, logical, zoom = 1, pan = {x:0,y:0}) {
    const scale = logical.scale * zoom;
    return {x:(point.x-physical.width/2-pan.x)/scale+logical.width/2,
            y:(point.y-physical.height/2-pan.y)/scale+logical.height/2};
}
