import React, { useEffect, useState } from 'react';
import { Canvas, Circle, Line } from '@shopify/react-native-skia';
import { Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    opacity: number;
}

export const ParticleNetwork = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Initialize particles
        const particleCount = 30;
        const initialParticles: Particle[] = [];

        for (let i = 0; i < particleCount; i++) {
            initialParticles.push({
                x: Math.random() * SCREEN_WIDTH,
                y: Math.random() * SCREEN_HEIGHT,
                vx: (Math.random() - 0.5) * 1.5,
                vy: (Math.random() - 0.5) * 1.5,
                radius: Math.random() * 2 + 1.5,
                opacity: Math.random() * 0.5 + 0.3,
            });
        }

        setParticles(initialParticles);

        // Animation loop - continuous movement
        const interval = setInterval(() => {
            setParticles(prevParticles =>
                prevParticles.map(particle => {
                    let newX = particle.x + particle.vx;
                    let newY = particle.y + particle.vy;
                    let newVx = particle.vx;
                    let newVy = particle.vy;

                    // Bounce off edges with maintained velocity
                    if (newX < 0 || newX > SCREEN_WIDTH) {
                        newVx *= -1;
                        // Add slight random variation on bounce
                        newVx += (Math.random() - 0.5) * 0.5;
                    }
                    if (newY < 0 || newY > SCREEN_HEIGHT) {
                        newVy *= -1;
                        // Add slight random variation on bounce
                        newVy += (Math.random() - 0.5) * 0.5;
                    }

                    // Keep in bounds
                    newX = Math.max(0, Math.min(SCREEN_WIDTH, newX));
                    newY = Math.max(0, Math.min(SCREEN_HEIGHT, newY));

                    // ✅ Maintain minimum speed to prevent stopping
                    const speed = Math.sqrt(newVx * newVx + newVy * newVy);
                    const minSpeed = 2;
                    const maxSpeed = 4;

                    if (speed < minSpeed) {
                        const factor = minSpeed / speed;
                        newVx *= factor;
                        newVy *= factor;
                    } else if (speed > maxSpeed) {
                        const factor = maxSpeed / speed;
                        newVx *= factor;
                        newVy *= factor;
                    }

                    // ✅ Add tiny random acceleration to keep things interesting
                    newVx += (Math.random() - 0.5) * 0.1;
                    newVy += (Math.random() - 0.5) * 0.1;

                    return {
                        ...particle,
                        x: newX,
                        y: newY,
                        vx: newVx,
                        vy: newVy,
                    };
                })
            );
        }, 32); // ~30fps

        return () => clearInterval(interval);
    }, []);

    return (
        <Canvas style={styles.canvas}>
            {particles.map((particle, index) => (
                <React.Fragment key={index}>
                    {/* Draw particle with glow */}
                    <Circle
                        cx={particle.x}
                        cy={particle.y}
                        r={particle.radius * 1.5}
                        color={`rgba(249, 115, 22, ${particle.opacity * 0.3})`}
                    />
                    <Circle
                        cx={particle.x}
                        cy={particle.y}
                        r={particle.radius}
                        color={`rgba(249, 115, 22, ${particle.opacity})`}
                    />

                    {/* Draw connections to nearby particles */}
                    {particles.slice(index + 1).map((otherParticle, otherIndex) => {
                        const dx = particle.x - otherParticle.x;
                        const dy = particle.y - otherParticle.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);

                        if (distance < 120) {
                            const opacity = Math.pow((120 - distance) / 120, 2) * 0.4;
                            return (
                                <Line
                                    key={`line-${index}-${otherIndex}`}
                                    p1={{ x: particle.x, y: particle.y }}
                                    p2={{ x: otherParticle.x, y: otherParticle.y }}
                                    color={`rgba(249, 115, 22, ${opacity})`}
                                    strokeWidth={0.8}
                                />
                            );
                        }
                        return null;
                    })}
                </React.Fragment>
            ))}
        </Canvas>
    );
};

const styles = StyleSheet.create({
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
        pointerEvents: 'none',
    },
});