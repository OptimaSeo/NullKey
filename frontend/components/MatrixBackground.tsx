/*
 * NullKey
 * Copyright (c) 2026 OptimaSeo
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, version 3.
 */

"use client";
import { useEffect } from "react";

export default function MatrixBackground() {
  useEffect(() => {
    const canvas = document.getElementById('matrix-bg') as HTMLCanvasElement;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Set jumlah kolom berdasarkan lebar layar agar rapi
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    const matrixChars = "010101NULLKEYXYZ<>[]{}";

    function drawMatrix() {
      const c = ctx!;
      // Background transparan untuk efek jejak (trail)
      c.fillStyle = 'rgba(5, 5, 5, 0.05)';
      c.fillRect(0, 0, width, height);

      c.fillStyle = '#00ff41'; // Warna teks hijau
      c.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const text = matrixChars.charAt(Math.floor(Math.random() * matrixChars.length));
        c.fillText(text, i * fontSize, drops[i] * fontSize);

        // Reset posisi ke atas secara acak
        if (drops[i] * fontSize > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    // Loop animasi
    const interval = setInterval(drawMatrix, 50);

    // Handle Resize
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas id="matrix-bg" className="fixed inset-0 -z-10 opacity-15" />;
}