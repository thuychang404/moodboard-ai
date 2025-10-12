// frontend/src/services/artGenerator.ts

export interface ArtGenerationOptions {
  width?: number;
  height?: number;
  colorPalette: string[];
  artStyle: 'circles' | 'sharp' | 'organic';
  energyLevel: 'high' | 'low';
}

export const generateAbstractArt = (
  canvas: HTMLCanvasElement,
  options: ArtGenerationOptions
): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width = 800, height = 600, colorPalette, artStyle, energyLevel } = options;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  // Create animated gradient background
  const gradient = ctx.createRadialGradient(
    width / 2,
    height / 2,
    0,
    width / 2,
    height / 2,
    Math.max(width, height) / 2
  );
  gradient.addColorStop(0, colorPalette[0] + '40');
  gradient.addColorStop(0.7, colorPalette[1] + '20');
  gradient.addColorStop(1, colorPalette[2] + '10');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Generate shapes based on mood
  const shapeCount = energyLevel === 'high' ? 20 : 12;

  for (let i = 0; i < shapeCount; i++) {
    ctx.globalAlpha = Math.random() * 0.8 + 0.2;
    ctx.fillStyle = colorPalette[Math.floor(Math.random() * colorPalette.length)];

    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 80 + 20;

    if (artStyle === 'circles') {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    } else if (artStyle === 'sharp') {
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let j = 0; j < 6; j++) {
        const angle = (j / 6) * Math.PI * 2;
        const radius = size + Math.random() * 40;
        ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.ellipse(
        x,
        y,
        size,
        size * (0.4 + Math.random() * 0.4),
        Math.random() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
};

export const canvasToDataURL = (canvas: HTMLCanvasElement): string => {
  return canvas.toDataURL('image/png');
};

export const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> => {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
};