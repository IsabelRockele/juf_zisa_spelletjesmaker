// Fit world bounds inside an unobscured screen rectangle (pixels, top-left origin).
export function fitGateCamera(width, height, safe, gate, player) {
  const left = Math.min(gate.x - 1.1, player.x - 1.2);
  const right = Math.max(gate.x + 7.1, player.x + 1.2);
  const bottom = Math.min(gate.y - .5, player.y - .5);
  const top = Math.max(gate.y + 4.1, player.y + 2.4);
  const scale = Math.min((safe.right-safe.left)/(right-left), (safe.bottom-safe.top)/(top-bottom));
  return {
    span: width/scale,
    x: (left+right)/2 - ((safe.left+safe.right)/2-width/2)/scale,
    y: (bottom+top)/2 + ((safe.top+safe.bottom)/2-height/2)/scale
  };
}
