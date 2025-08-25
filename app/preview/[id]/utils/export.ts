export async function exportSVGToPNG(svgEl: SVGSVGElement, scale = 2): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svgEl);
  const svg64 = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
  const img = new Image();
  const w = svgEl.viewBox.baseVal.width || svgEl.clientWidth;
  const h = svgEl.viewBox.baseVal.height || svgEl.clientHeight;

  await new Promise<void>(res => { img.onload = ()=>res(); img.src = svg64; });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return await new Promise<Blob>((res)=> canvas.toBlob(b=>res(b!), 'image/png', 1));
}

export async function exportSVGToBlob(svgEl: SVGSVGElement): Promise<Blob> {
  const xml = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([xml], { type: 'image/svg+xml' });
  return blob;
}
