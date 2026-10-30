import React, { useEffect, useRef } from 'react';
import { useAudio } from '../../contexts/AudioContext';

export const LiveAudioVisualizer: React.FC<{ isActive?: boolean }> = ({ isActive = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { audioFrequencyData, isRecording, isSpeaking } = useAudio();

  const active = isActive || isRecording || isSpeaking;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const barCount = 36;
      const barWidth = 6;
      const gap = (width - barCount * barWidth) / (barCount - 1);

      // Create glowing cyan-to-violet gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#00f2fe');
      gradient.addColorStop(0.5, '#4facfe');
      gradient.addColorStop(1, '#8a2be2');

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4; // Minimal rest height

        if (active && audioFrequencyData && audioFrequencyData.length > 0) {
          const dataIndex = Math.floor((i / barCount) * (audioFrequencyData.length / 2));
          const value = audioFrequencyData[dataIndex] || 0;
          barHeight = Math.max(4, (value / 255) * height * 0.9);
        } else if (active) {
          // Simulated smooth pulsing if frequency data buffer is initializing
          barHeight = Math.sin(Date.now() / 200 + i * 0.4) * 12 + 16;
        }

        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        ctx.fillStyle = gradient;
        ctx.beginPath();
        // Rounded bars
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();

        // Subtle ambient glow on active bars
        if (active && barHeight > 10) {
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(0, 242, 254, 0.4)';
        } else {
          ctx.shadowBlur = 0;
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [active, audioFrequencyData]);

  return (
    <div className="w-full flex justify-center py-1">
      <canvas
        ref={canvasRef}
        width={420}
        height={56}
        className="audio-visualizer-canvas rounded-xl bg-slate-950/60 border border-white/5 shadow-inner"
        style={{
          boxShadow: active
            ? 'inset 0 0 15px rgba(0, 242, 254, 0.15), 0 0 20px rgba(0, 242, 254, 0.1)'
            : 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
        }}
      />
    </div>
  );
};
