import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'motion/react';
import { useParams, useNavigate } from 'react-router';
import { Loader2, Crown, Zap, Sparkles, ArrowLeft, Play, Pause, Music, Share2, Check, Aperture, Clapperboard } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { formatTrackTitle } from '../utils/formatTrackTitle';
import { usePlayer, Track } from '../context/PlayerContext';
import { useCrateSafe } from '../context/CrateContext';
import { GoldVinylRecord } from '../components/GoldVinylRecord';

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-715f71b9`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface ArtistTrack {
    videoId: string;
    title: string;
    channelTitle: string;
    thumbnail: string;
    source: 'youtube' | 'soundcloud';
    soundcloudUrl?: string;
    coverArtUrl?: string | null;
}

interface ArtistDetailData {
    slug: string;
    name: string;
    role: string;
    bio: string;
    photoUrl: string | null;
    badge: 'pioneer' | 'legend' | 'rising' | null;
    socials: Record<string, string>;
    tracks: ArtistTrack[];
}

const BADGE_CONFIG: Record<string, { label: string; icon: any; color: string; glow: string; bg: string }> = {
    pioneer: { label: 'PIONEER', icon: Crown, color: '#FFD700', glow: 'rgba(255,215,0,0.35)', bg: 'rgba(255,215,0,0.12)' },
    legend: { label: 'LEGEND', icon: Check, color: '#9D00FF', glow: 'rgba(157,0,255,0.35)', bg: 'rgba(157,0,255,0.12)' },
    rising: { label: 'RISING', icon: Sparkles, color: '#00FF88', glow: 'rgba(0,255,136,0.35)', bg: 'rgba(0,255,136,0.12)' },
};

// ─── Social Icons (inline SVGs) ───────────────────────────────────────────────
function InstagramIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="5" />
            <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    );
}

function TwitterIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function SoundCloudIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1 18V11l.5-1 .5 1v7zm3 0V8.5l.5-1 .5 1V18zm3 0V6l.5-1.5L8 6v12zm3 0V4l.5-2 .5 2v14zm3.5 0c2.5 0 4.5-2 4.5-4.5S16 9 13.5 9H13V18z" />
        </svg>
    );
}

function SpotifyIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
    );
}

function YouTubeIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
    );
}

function TikTokIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.75a8.28 8.28 0 0 0 4.83 1.55V6.87a4.85 4.85 0 0 1-1.07-.18z" />
        </svg>
    );
}

function PatreonIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.13 1.08 7.255 1.042 11.458c-.046 5.061 1.488 11.536 7.216 12.38 5.767.85 8.163-4.707 9.872-9.13 1.107-2.868 4.84-5.064 4.827-7.498zM5.568 21.057c-2.454.01-4.524-1.89-4.524-4.526V4.492c.005-2.58 1.996-4.492 4.407-4.492h.117c2.51-.01 4.5 1.94 4.5 4.542v12.012c0 2.457-1.921 4.482-4.417 4.5l-.083.003z" />
        </svg>
    );
}

const SOCIAL_ICONS: Record<string, React.FC> = {
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    soundcloud: SoundCloudIcon,
    spotify: SpotifyIcon,
    youtube: YouTubeIcon,
    tiktok: TikTokIcon,
    patreon: PatreonIcon,
};

const SOCIAL_URLS: Record<string, (handle: string) => string> = {
    instagram: (h) => `https://instagram.com/${h.replace('@', '')}`,
    twitter: (h) => `https://x.com/${h.replace('@', '')}`,
    soundcloud: (h) => h.startsWith('http') ? h : `https://soundcloud.com/${h}`,
    spotify: (h) => h.startsWith('http') ? h : `https://open.spotify.com/artist/${h}`,
    youtube: (h) => h.startsWith('http') ? h : `https://youtube.com/${h}`,
    tiktok: (h) => `https://tiktok.com/${h.startsWith('@') ? h : '@' + h}`,
    patreon: (h) => h.startsWith('http') ? h : `https://patreon.com/${h}`,
};

const SOCIAL_LABELS: Record<string, string> = {
    instagram: 'Instagram',
    twitter: 'X / Twitter',
    soundcloud: 'SoundCloud',
    spotify: 'Spotify',
    youtube: 'YouTube',
    tiktok: 'TikTok',
    patreon: 'Patreon',
};

// ─── Visionary Lens Badge (Premium Detailed Physical UI) ─────────────────────────
function VisionaryLensBadge({ size = 32 }: { size?: number }) {
    return (
        <div
            className="group-hover:scale-[1.15] transition-transform duration-300 ease-out relative flex items-center justify-center rounded-full overflow-hidden"
            style={{
                width: size,
                height: size,
                background: 'radial-gradient(circle at 30% 30%, #2D1B4E, #0A0512 80%)',
                border: '1.5px solid rgba(168, 85, 247, 0.5)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.8), inset 0 0 8px rgba(168, 85, 247, 0.4), 0 0 10px rgba(168, 85, 247, 0.3)',
            }}
        >
            {/* Outer Lens Ring (Textured) */}
            <div
                className="absolute inset-[15%] rounded-full border border-[rgba(255,255,255,0.1)] pointer-events-none"
                style={{
                    background: 'conic-gradient(from 0deg, #111, #333, #111, #333, #111)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.9)'
                }}
            />
            {/* Inner Glass Element */}
            <div
                className="absolute inset-[22%] rounded-full overflow-hidden shadow-[inset_0_4px_10px_rgba(0,0,0,1)]"
                style={{
                    background: 'radial-gradient(circle at 40% 40%, rgba(200,100,255,0.25) 0%, rgba(0,0,0,0.95) 80%)'
                }}
            >
                {/* Hyper detailed aperture blades overlapping */}
                <Aperture size={size * 0.45} className="absolute top-1/2 left-1/2 text-[rgba(168,85,247,0.8)] z-10" strokeWidth={1} style={{ transform: 'translate(-50%, -50%) rotate(15deg)' }} />
                <Aperture size={size * 0.45} className="absolute top-1/2 left-1/2 text-[rgba(233,213,255,0.4)] z-10" strokeWidth={0.5} style={{ transform: 'translate(-50%, -50%) rotate(30deg)' }} />

                {/* Curved Conxex Glass Reflection */}
                <div
                    className="absolute top-[-10%] left-[-10%] w-[120%] h-[55%] rounded-full opacity-70 mix-blend-screen pointer-events-none"
                    style={{
                        background: 'linear-gradient(160deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 60%)',
                        transform: 'rotate(-20deg)',
                    }}
                />

                {/* Cyan/Magenta chromatic aberration hint at extreme glass edges */}
                <div
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full mix-blend-screen opacity-40 blur-[3px]"
                    style={{ background: '#00FFFF' }}
                />
                <div
                    className="absolute top-0 left-0 w-3 h-3 rounded-full mix-blend-screen opacity-40 blur-[3px]"
                    style={{ background: '#FF00FF' }}
                />
                {/* Physical Center Sensor Element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] h-[18%] bg-[#E9D5FF] rounded-full shadow-[0_0_4px_#A855F7] z-20" />
            </div>
        </div>
    );
}

// ─── Director Clapper Badge (Premium Detailed Physical UI) ───────────────────
function DirectorClapperBadge({ size = 32 }: { size?: number }) {
    // The previous badge was circled. 
    // This one is a cut-out, sleek, physical clapperboard object.
    return (
        <div
            className="group-hover:scale-[1.15] transition-transform duration-300 ease-out relative flex items-center justify-center pointer-events-auto"
            style={{
                width: size * 1.3,
                height: size * 1.3,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,1))'
            }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full z-10" style={{ transform: 'scale(1.2)' }}>
                <defs>
                    <linearGradient id="boardBase" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#27272A" />
                        <stop offset="100%" stopColor="#000000" />
                    </linearGradient>
                    <linearGradient id="boardStick" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3F3F46" />
                        <stop offset="100%" stopColor="#09090B" />
                    </linearGradient>
                    <linearGradient id="glare" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                    <linearGradient id="glassReflection" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </linearGradient>
                </defs>
                <g strokeWidth="0.75" stroke="rgba(255,255,255,0.4)">
                    {/* Clapperboard Base (Bottom rectangle) */}
                    <path d="M 10 45 L 90 45 L 90 90 L 10 90 Z" fill="url(#boardBase)" rx="2" />

                    {/* Inner recessed slate area */}
                    <rect x="15" y="50" width="70" height="35" fill="#000000" stroke="#333" strokeWidth="1.5" rx="1" />
                    <rect x="15" y="50" width="70" height="35" fill="url(#glassReflection)" rx="1" pointerEvents="none" />

                    {/* Slate text lines hint */}
                    <line x1="20" y1="58" x2="45" y2="58" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="20" y1="65" x2="60" y2="65" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="20" y1="72" x2="35" y2="72" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Diagonal Black/White styling stripes on base top edge */}
                    <g stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="square">
                        <line x1="16" y1="45" x2="6" y2="55" />
                        <line x1="36" y1="45" x2="26" y2="55" />
                        <line x1="56" y1="45" x2="46" y2="55" />
                        <line x1="76" y1="45" x2="66" y2="55" />
                        <line x1="96" y1="45" x2="86" y2="55" />
                    </g>

                    {/* Clapperboard Stick (Angled Up/Open) */}
                    <g transform="rotate(-25, 10, 45)">
                        <path d="M 10 33 L 90 33 L 90 45 L 10 45 Z" fill="url(#boardStick)" stroke="rgba(255,255,255,0.5)" rx="2" />
                        <g stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="square">
                            <line x1="16" y1="33" x2="6" y2="43" />
                            <line x1="36" y1="33" x2="26" y2="43" />
                            <line x1="56" y1="33" x2="46" y2="43" />
                            <line x1="76" y1="33" x2="66" y2="43" />
                            <line x1="96" y1="33" x2="86" y2="43" />
                        </g>
                        {/* Stick top glare */}
                        <path d="M 12 34 L 88 34 L 88 36.5 L 12 36.5 Z" fill="url(#glare)" stroke="none" />
                    </g>

                    {/* Base top glare */}
                    <path d="M 12 46 L 88 46 L 88 48 L 12 48 Z" fill="url(#glare)" stroke="none" />

                    {/* Hinge Joint */}
                    <circle cx="10" cy="45" r="4.5" fill="#D8B4FE" stroke="rgba(0,0,0,1)" strokeWidth="1.5" />
                    <circle cx="10" cy="45" r="1.5" fill="#111" stroke="none" />
                </g>
            </svg>
        </div>
    );
}

// ─── Global Impact Badge (Premium Glass Globe UI) ───────────────────────────
function GlobalImpactBadge({ size = 32 }: { size?: number }) {
    return (
        <div
            className="group-hover:scale-[1.15] transition-transform duration-300 ease-out relative flex items-center justify-center pointer-events-auto"
            style={{
                width: size,
                height: size,
                filter: 'drop-shadow(0 0 12px rgba(139, 92, 246, 0.45)) drop-shadow(0 4px 6px rgba(0,0,0,0.8))'
            }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full z-10 block" style={{ transform: 'scale(1.2)' }}>
                <defs>
                    <radialGradient id="globeSpace" cx="30%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#2E1065" /> {/* Highlight Purple */}
                        <stop offset="50%" stopColor="#0B0317" /> {/* Deep Void */}
                        <stop offset="100%" stopColor="#000000" /> {/* Pitch Black Edge */}
                    </radialGradient>

                    <radialGradient id="globeGlassReflection" cx="35%" cy="20%" r="50%">
                        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
                        <stop offset="30%" stopColor="rgba(255, 255, 255, 0.15)" />
                        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </radialGradient>

                    <linearGradient id="networkLinks" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFE066" />
                        <stop offset="40%" stopColor="#D97706" />
                        <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>

                    <linearGradient id="orbitalRing" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgba(196, 181, 253, 0)" />
                        <stop offset="25%" stopColor="rgba(196, 181, 253, 0.8)" />
                        <stop offset="50%" stopColor="#FFFFFF" />
                        <stop offset="75%" stopColor="rgba(196, 181, 253, 0.8)" />
                        <stop offset="100%" stopColor="rgba(196, 181, 253, 0)" />
                    </linearGradient>

                    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>

                    <filter id="landmassGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="0.8" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <g>
                    {/* Atmospheric outer haze */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(139, 92, 246, 0.25)" strokeWidth="6" filter="blur(3px)" />
                    <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(216, 180, 254, 0.1)" strokeWidth="2" filter="blur(1px)" />

                    {/* Primary Solid Sphere */}
                    <circle cx="50" cy="50" r="43" fill="url(#globeSpace)" />

                    {/* Thick edge shadowing for volumetric depth */}
                    <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(0,0,0,1)" strokeWidth="5" opacity="0.8" />
                    <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth="10" opacity="0.6" />

                    {/* Cyberpunk wireframe grid */}
                    <g stroke="rgba(139, 92, 246, 0.25)" strokeWidth="0.75" fill="none">
                        {/* Horizontal curves */}
                        <ellipse cx="50" cy="50" rx="43" ry="10" />
                        <ellipse cx="50" cy="50" rx="43" ry="22" />
                        <ellipse cx="50" cy="50" rx="43" ry="34" />
                        {/* Vertical curves */}
                        <ellipse cx="50" cy="50" rx="10" ry="43" />
                        <ellipse cx="50" cy="50" rx="22" ry="43" />
                        <ellipse cx="50" cy="50" rx="34" ry="43" />
                        {/* Equator & Prime Meridian */}
                        <line x1="7" y1="50" x2="93" y2="50" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" />
                        <line x1="50" y1="7" x2="50" y2="93" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" />
                    </g>

                    {/* Intricate Glowing Landmasses */}
                    <g filter="url(#landmassGlow)">
                        {/* Continent A (Top Left) */}
                        <path
                            d="M 15 35 Q 25 20 40 25 T 50 15 Q 60 25 50 40 T 35 45 Q 20 40 15 35 Z"
                            fill="rgba(124, 58, 237, 0.3)" stroke="rgba(196, 181, 253, 0.8)" strokeWidth="1" strokeLinejoin="round"
                        />
                        {/* Continent B (Bottom Right) */}
                        <path
                            d="M 55 60 Q 75 55 85 70 T 70 85 Q 60 80 50 75 T 45 65 Z"
                            fill="rgba(124, 58, 237, 0.2)" stroke="rgba(196, 181, 253, 0.6)" strokeWidth="0.75" strokeLinejoin="round"
                        />
                        {/* Continent C (Archipelago) */}
                        <path
                            d="M 22 65 Q 35 75 25 82 T 12 70 Z"
                            fill="rgba(139, 92, 246, 0.2)" stroke="rgba(196, 181, 253, 0.5)" strokeWidth="0.5" strokeLinejoin="round"
                        />
                        <path
                            d="M 75 35 Q 85 30 88 45 T 78 50 Z"
                            fill="rgba(139, 92, 246, 0.15)" stroke="rgba(196, 181, 253, 0.4)" strokeWidth="0.5" strokeLinejoin="round"
                        />
                    </g>

                    {/* Highly detailed global network lines & data routing */}
                    <g stroke="url(#networkLinks)" fill="none" filter="url(#neonGlow)">
                        {/* Main routes */}
                        <path d="M 28 35 L 45 42 L 65 30" strokeWidth="1.2" strokeDasharray="3 2" />
                        <path d="M 45 42 L 52 65 L 75 70" strokeWidth="1.5" strokeDasharray="1 3" />
                        <path d="M 20 68 L 35 60 L 52 65" strokeWidth="1" />
                        <path d="M 45 42 L 35 60" strokeWidth="0.8" opacity="0.6" />
                        <path d="M 65 30 L 80 40 L 75 70" strokeWidth="0.8" opacity="0.7" strokeDasharray="2 2" />

                        {/* Hub Nodes (Glowing Stars/Cities) */}
                        <circle cx="28" cy="35" r="1.5" fill="#FFF" stroke="none" />
                        <circle cx="45" cy="42" r="2.5" fill="#FFE066" stroke="none" />
                        <circle cx="65" cy="30" r="1.8" fill="#FFF" stroke="none" />
                        <circle cx="52" cy="65" r="2" fill="#FDE047" stroke="none" />
                        <circle cx="75" cy="70" r="1.5" fill="#FFF" stroke="none" />
                        <circle cx="20" cy="68" r="1" fill="#FFF" stroke="none" />
                        <circle cx="35" cy="60" r="1.2" fill="#FFF" stroke="none" />
                        <circle cx="80" cy="40" r="1" fill="#FFF" stroke="none" />
                    </g>

                    {/* Dynamic Orbital Ring System */}
                    <g transform="rotate(-30 50 50)">
                        {/* Front of ring */}
                        <path
                            d="M -2 50 A 52 14 0 0 0 102 50"
                            fill="none" stroke="url(#orbitalRing)" strokeWidth="1.5" filter="url(#neonGlow)"
                        />
                        {/* Tiny orbiting particles on front ring */}
                        <circle cx="15" cy="59" r="0.8" fill="#FFF" />
                        <circle cx="85" cy="59" r="1" fill="#FFF" />

                        {/* Back of ring (faded/behind globe look via simple opacity masking overlay) */}
                        <path
                            d="M -2 50 A 52 14 0 0 1 102 50"
                            fill="none" stroke="url(#orbitalRing)" strokeWidth="0.5" opacity="0.15"
                        />
                    </g>

                    {/* Core Specular Glass Dome overlay for absolute 3D realism */}
                    <circle cx="50" cy="50" r="43" fill="url(#globeGlassReflection)" pointerEvents="none" />

                    {/* Secondary edge rim light for ultra-crisp border */}
                    <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="1" strokeLinecap="round" />
                    <path d="M 16 75 A 40 40 0 0 0 84 75" fill="none" stroke="rgba(196, 181, 253, 0.4)" strokeWidth="0.75" strokeLinecap="round" />
                </g>
            </svg>
        </div>
    );
}

// ─── Vinyl Globe Badge (Transparent Vintage Vinyl) ──────────────────────────
function VinylGlobeBadge({ size = 32 }: { size?: number }) {
    return (
        <div
            className="group-hover:scale-[1.1] transition-transform duration-300 ease-out relative flex items-center justify-center pointer-events-auto"
            style={{
                width: size * 1.5,
                height: size * 1.5,
            }}
        >
            <svg viewBox="0 0 200 200" className="w-full h-full z-10 block">
                <defs>
                    <linearGradient id="vgSpec1" x1="0.2" y1="0.2" x2="0.8" y2="0.8">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
                        <stop offset="15%" stopColor="rgba(255,255,255,0.1)" />
                        <stop offset="45%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="55%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="85%" stopColor="rgba(255,255,255,0.05)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.3)" />
                    </linearGradient>
                    <linearGradient id="vgSpec2" x1="0.8" y1="0.2" x2="0.2" y2="0.8">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
                        <stop offset="15%" stopColor="rgba(255,255,255,0.05)" />
                        <stop offset="45%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="55%" stopColor="rgba(255,255,255,0)" />
                        <stop offset="85%" stopColor="rgba(255,255,255,0.05)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                    </linearGradient>

                    <path id="vgArcTop" d="M 62 100 A 38 38 0 0 1 138 100" />
                    <path id="vgArcBottom" d="M 138 100 A 38 38 0 0 1 62 100" />

                    {/* Globe Gradients */}
                    <radialGradient id="vgGlobeOcean" cx="40%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#38BDF8" />
                        <stop offset="45%" stopColor="#0EA5E9" />
                        <stop offset="85%" stopColor="#0369A1" />
                        <stop offset="100%" stopColor="#082F49" />
                    </radialGradient>
                    <linearGradient id="vgGlobeLand" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#A3E635" />
                        <stop offset="35%" stopColor="#22C55E" />
                        <stop offset="70%" stopColor="#A16207" />
                        <stop offset="100%" stopColor="#14532D" />
                    </linearGradient>
                    <radialGradient id="vgGlobeClouds" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
                        <stop offset="70%" stopColor="rgba(255,255,255,0.4)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                    </radialGradient>
                    <radialGradient id="vgGlobeShadow" cx="65%" cy="65%" r="55%">
                        <stop offset="30%" stopColor="rgba(0,0,0,0)" />
                        <stop offset="75%" stopColor="rgba(0,0,0,0.6)" />
                        <stop offset="100%" stopColor="rgba(0,0,0,0.95)" />
                    </radialGradient>
                    <filter id="vgCloudBlur" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                    </filter>
                </defs>

                {/* Vinyl Body */}
                <circle cx="100" cy="100" r="98" fill="#0A0A0A" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <circle cx="100" cy="100" r="95" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="3" />
                <circle cx="100" cy="100" r="93" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Grooves */}
                <g>
                    {[91, 89, 87, 85, 83, 81, 79, 77, 75, 73, 69, 67, 65, 63, 61, 59].map(r => (
                        <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" />
                    ))}
                    {[92, 88, 84, 80, 76, 72, 68, 64, 60].map(r => (
                        <circle key={'dark' + r} cx="100" cy="100" r={r} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="0.3" />
                    ))}
                    {[86, 78, 66].map(r => (
                        <circle key={'bright' + r} cx="100" cy="100" r={r} fill="none" stroke="url(#vgSpec1)" strokeWidth="0.8" />
                    ))}
                </g>

                {/* Specular */}
                <path d="M 30.7 30.7 L 100 100 L 169.3 30.7 A 98 98 0 0 0 30.7 30.7 Z" fill="rgba(255,255,255,0.15)" />
                <path d="M 30.7 169.3 L 100 100 L 169.3 169.3 A 98 98 0 0 1 30.7 169.3 Z" fill="rgba(255,255,255,0.08)" />
                <circle cx="100" cy="100" r="98" fill="url(#vgSpec1)" style={{ mixBlendMode: 'overlay' }} />
                <circle cx="100" cy="100" r="98" fill="url(#vgSpec2)" />

                {/* Label Base */}
                <circle cx="100" cy="100" r="55" fill="#E8DEC9" />
                <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />

                {/* Arrows */}
                <g opacity="0.95">
                    {/* Top Red Arrow */}
                    <path d="M 56 100 A 44 44 0 0 1 144 100 L 152 100 L 134 116 L 116 100 L 126 100 A 26 26 0 0 0 74 100 Z" fill="#DE584E" />
                    {/* Bottom Yellow Arrow */}
                    <path d="M 144 100 A 44 44 0 0 1 56 100 L 48 100 L 66 84 L 84 100 L 74 100 A 26 26 0 0 0 126 100 Z" fill="#EACC59" />
                </g>

                {/* Texts */}
                <text fontSize="7" fontWeight="900" fill="#2A2A2A" letterSpacing="1" fontFamily="ui-sans-serif, system-ui, sans-serif">
                    <textPath href="#vgArcTop" startOffset="50%" textAnchor="middle" dominantBaseline="middle">JERSEY CLUB</textPath>
                </text>
                <text fontSize="8" fontWeight="900" fill="#2A2A2A" letterSpacing="2.5" fontFamily="ui-sans-serif, system-ui, sans-serif">
                    <textPath href="#vgArcBottom" startOffset="50%" textAnchor="middle" dominantBaseline="central">KING</textPath>
                </text>

                <text x="60" y="97" fontSize="4.5" fontWeight="800" fill="#111" textAnchor="middle">45 rpm</text>
                <text x="60" y="103" fontSize="4" fontWeight="800" fill="#111" textAnchor="middle">EP 004</text>
                <text x="60" y="109" fontSize="3.5" fontWeight="700" fill="#111" textAnchor="middle">STEREO</text>

                <rect x="127" y="96" width="26" height="9" fill="#DE584E" rx="1.5" />
                <text x="140" y="103" fontSize="4.5" fontWeight="800" fill="#FFF" textAnchor="middle" letterSpacing="0.5">GROOVE</text>

                <text x="100" y="65" fontSize="3.5" fontWeight="800" fill="#111" textAnchor="middle" letterSpacing="0.5">SIDE A</text>

                {/* Inner Globe */}
                <g transform="translate(68, 68) scale(0.64)">
                    <circle cx="50" cy="50" r="48" fill="white" />
                    <circle cx="50" cy="50" r="46" fill="rgba(125, 211, 252, 0.4)" filter="url(#vgCloudBlur)" />
                    <circle cx="50" cy="50" r="44" fill="url(#vgGlobeOcean)" />

                    <g fill="url(#vgGlobeLand)">
                        <path d="M 26 20 C 35 12, 48 10, 44 24 C 41 35, 34 38, 28 35 C 22 32, 18 28, 26 20 Z" />
                        <path d="M 28 35 C 38 35, 46 48, 42 65 C 38 78, 30 75, 27 60 C 24 48, 20 40, 28 35 Z" />
                        <path d="M 78 18 C 65 24, 60 42, 68 55 C 76 68, 86 60, 92 45 C 94 32, 88 20, 78 18 Z" />
                        <path d="M 18 42 C 22 45, 20 50, 16 48 Z" />
                        <path d="M 46 45 C 50 48, 52 55, 48 58 C 45 60, 42 55, 46 45 Z" />
                        <path d="M 55 72 C 60 70, 65 75, 58 78 Z" />
                    </g>

                    <g filter="url(#vgCloudBlur)" fill="url(#vgGlobeClouds)">
                        <path d="M 38 28 Q 50 35 60 22 T 70 35 Q 55 45 45 38 Z" opacity="0.85" />
                        <path d="M 18 60 Q 28 52 35 65 T 20 75 Z" opacity="0.75" />
                        <path d="M 75 22 Q 90 28 85 45 T 72 32 Z" opacity="0.8" />
                        <path d="M 22 25 C 28 28, 24 35, 18 30" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" fill="none" />
                        <path d="M 45 65 C 55 68, 62 60, 58 55" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" fill="none" />
                    </g>

                    <path d="M 32 10 Q 50 16 68 10 T 50 6 Z" fill="rgba(240, 249, 255, 0.85)" />
                    <path d="M 32 90 Q 50 84 68 90 T 50 94 Z" fill="rgba(240, 249, 255, 0.7)" />

                    <circle cx="50" cy="50" r="44" fill="url(#vgGlobeShadow)" />
                    <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* Spindle Cutout */}
                <circle cx="100" cy="100" r="7" fill="#0B0A10" />
                <circle cx="100" cy="100" r="7" fill="none" stroke="rgba(0,0,0,0.8)" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="8.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="9.5" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
            </svg>
        </div >
    );
}

// ─── 24 Carat Crate Badge (Detailed Gold UI) ────────────────────────────────
function CaratCrateBadge({ size = 32 }: { size?: number }) {
    return (
        <div
            className="group-hover:scale-[1.1] transition-transform duration-300 ease-out relative flex items-center justify-center pointer-events-auto"
            style={{
                width: size * 1.05,
                height: size * 1.05,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 6px rgba(251, 191, 36, 0.3))'
            }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full z-10 block" style={{ transform: 'scale(0.95)' }}>
                <defs>
                    <linearGradient id="goldFront" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FDE047" />    {/* Light Gold */}
                        <stop offset="50%" stopColor="#EAB308" />   {/* Pure Gold */}
                        <stop offset="100%" stopColor="#B45309" />  {/* Dark Gold Shadow */}
                    </linearGradient>
                    <linearGradient id="goldSide" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#F59E0B" />
                        <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                    <linearGradient id="goldInside" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#451A03" />
                        <stop offset="100%" stopColor="#78350F" />
                    </linearGradient>
                    <linearGradient id="vinylGold" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FEF08A" />
                        <stop offset="30%" stopColor="#FDE047" />
                        <stop offset="50%" stopColor="#78350F" />
                        <stop offset="70%" stopColor="#FDE047" />
                        <stop offset="100%" stopColor="#92400E" />
                    </linearGradient>
                </defs>
                <g>
                    {/* Background/Inside of Crate */}
                    <path d="M 20 40 L 80 40 L 90 60 L 10 60 Z" fill="url(#goldInside)" />

                    {/* Golden Vinyl Records stacked inside */}
                    {/* Record 1 */}
                    <g transform="translate(15, 20)">
                        <circle cx="35" cy="25" r="22" fill="url(#vinylGold)" stroke="#B45309" strokeWidth="1" />
                        <circle cx="35" cy="25" r="7" fill="#111" />
                        <circle cx="35" cy="25" r="2" fill="#FEF08A" />
                    </g>
                    {/* Record 2 */}
                    <g transform="translate(25, 15)">
                        <circle cx="35" cy="25" r="22" fill="url(#vinylGold)" stroke="#B45309" strokeWidth="1.5" />
                        <ellipse cx="35" cy="25" rx="18" ry="18" fill="none" stroke="rgba(69, 26, 3, 0.4)" strokeWidth="2" />
                        <circle cx="35" cy="25" r="8" fill="#FDE047" />
                        <circle cx="35" cy="25" r="2" fill="#000" />
                    </g>
                    {/* Record 3 (Frontmost) */}
                    <g transform="translate(10, 25)">
                        <circle cx="35" cy="25" r="22" fill="url(#vinylGold)" stroke="#FFF" strokeWidth="0.5" />
                        <circle cx="35" cy="25" r="7" fill="#78350F" />
                        <circle cx="35" cy="25" r="2" fill="#FEF08A" />
                        {/* Shiny gleam on record */}
                        <path d="M 18 10 Q 30 5 45 10" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                    </g>

                    {/* Crate Front Panel */}
                    <path d="M 10 50 L 90 50 L 82 85 L 18 85 Z" fill="url(#goldFront)" stroke="#FEF08A" strokeWidth="1.5" />

                    {/* Crate Left Side Panel */}
                    <path d="M 10 50 L 20 40 L 25 75 L 18 85 Z" fill="url(#goldSide)" stroke="#FDE047" strokeWidth="1" />
                    {/* Crate Right Side Panel */}
                    <path d="M 90 50 L 80 40 L 75 75 L 82 85 Z" fill="url(#goldSide)" stroke="#FDE047" strokeWidth="1" />

                    {/* Front Panel Planks / Details */}
                    <line x1="16" y1="60" x2="84" y2="60" stroke="#92400E" strokeWidth="2" />
                    <line x1="14" y1="70" x2="86" y2="70" stroke="#92400E" strokeWidth="2" />
                    <line x1="12" y1="80" x2="88" y2="80" stroke="#92400E" strokeWidth="2" />

                    {/* Front Plate / Logo (24K stamp) */}
                    <rect x="40" y="62" width="20" height="12" fill="#451A03" rx="2" stroke="#FEF08A" strokeWidth="1" />
                    <text x="50" y="70" fill="#FEF08A" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">24K</text>

                    {/* Corner Brackets / Rivets */}
                    <rect x="9" y="49" width="3" height="6" fill="#FFF" />
                    <rect x="17" y="82" width="3" height="4" fill="#FFF" />
                    <rect x="88" y="49" width="3" height="6" fill="#FFF" />
                    <rect x="80" y="82" width="3" height="4" fill="#FFF" />

                    {/* Huge front shine / bevel */}
                    <path d="M 12 52 L 88 52 L 85 55 L 15 55 Z" fill="rgba(255,255,255,0.6)" />
                </g>
            </svg>
        </div>
    );
}

// ─── DJ Jayhood DAW Track View Plaque ─────────────────────────────────────
function DAWTrackPlaqueBadge({ size = 64 }: { size?: number }) {
    return (
        <div
            className="group relative flex items-center justify-center pointer-events-auto transition-transform duration-300 ease-out hover:scale-[1.35] origin-top-right z-10"
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 100 120" className="w-full h-full" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.7))' }}>
                <defs>
                    <linearGradient id="jh-frame" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#2A2A2A" />
                        <stop offset="50%" stopColor="#1A1A1A" />
                        <stop offset="100%" stopColor="#111111" />
                    </linearGradient>
                    <clipPath id="jh-screen"><rect x="12" y="12" width="76" height="82" rx="2" /></clipPath>
                </defs>

                {/* Plaque frame */}
                <rect x="2" y="2" width="96" height="116" rx="4" fill="url(#jh-frame)" stroke="#3A3A3A" strokeWidth="1.5" />
                <rect x="5" y="5" width="90" height="110" rx="3" fill="none" stroke="#333" strokeWidth="0.5" />

                {/* DAW screen backing */}
                <rect x="10" y="10" width="80" height="86" rx="2.5" fill="#111113" stroke="#2A2A2A" strokeWidth="0.7" />

                {/* DAW content — clipped to screen */}
                <g clipPath="url(#jh-screen)">

                    {/* Top toolbar */}
                    <rect x="12" y="12" width="76" height="7" fill="#1A1A1E" />
                    {/* Transport controls — tiny circles */}
                    <circle cx="17" cy="15.5" r="1.2" fill="#555" />
                    <rect x="20.5" y="14" width="3" height="3" rx="0.4" fill="#555" />
                    {/* Play triangle */}
                    <polygon points="26,14 26,17 29,15.5" fill="#00CC66" />
                    {/* BPM readout */}
                    <rect x="33" y="13.8" width="12" height="3.4" rx="0.5" fill="#0D0D10" stroke="#333" strokeWidth="0.3" />
                    <text x="39" y="16.3" textAnchor="middle" fill="#00CC66" fontSize="2.6" fontFamily="monospace" fontWeight="700">140</text>
                    {/* Timeline bar numbers */}
                    <text x="58" y="16.2" fill="#444" fontSize="2" fontFamily="monospace">1</text>
                    <text x="66" y="16.2" fill="#444" fontSize="2" fontFamily="monospace">5</text>
                    <text x="74" y="16.2" fill="#444" fontSize="2" fontFamily="monospace">9</text>
                    <text x="82" y="16.2" fill="#444" fontSize="2" fontFamily="monospace">13</text>

                    {/* Track panel sidebar + lanes */}
                    {/* Track 1 — Drums (orange) */}
                    <rect x="12" y="20" width="14" height="9" fill="#141417" />
                    <rect x="12" y="20" width="0.7" height="9" fill="#E8853A" />
                    <text x="15" y="25.8" fill="#888" fontSize="2.2" fontFamily="monospace">DRUMS</text>
                    <rect x="26" y="20" width="62" height="9" fill="#111114" />
                    {/* Drum clips — staccato blocks */}
                    <rect x="27" y="21.5" width="10" height="6" rx="0.8" fill="#E8853A" opacity="0.75" />
                    <rect x="38" y="21.5" width="6" height="6" rx="0.8" fill="#E8853A" opacity="0.60" />
                    <rect x="45" y="21.5" width="10" height="6" rx="0.8" fill="#E8853A" opacity="0.75" />
                    <rect x="56" y="21.5" width="14" height="6" rx="0.8" fill="#E8853A" opacity="0.65" />
                    <rect x="72" y="21.5" width="8" height="6" rx="0.8" fill="#E8853A" opacity="0.7" />
                    {/* Waveform hints inside drum clips */}
                    <path d="M28,24.5 l1,-1.5 l1,2.5 l1,-2 l1,1.8 l1,-1 l1,1.5 l1,-2.2 l1,1.8 l0.5,-0.5" fill="none" stroke="#FFC08A" strokeWidth="0.5" opacity="0.7" />
                    <path d="M46,24.5 l1,-1.2 l1,2 l1,-1.8 l1,1.5 l1,-1.3 l1,2 l1,-1.5 l1,1 l0.5,-0.8" fill="none" stroke="#FFC08A" strokeWidth="0.5" opacity="0.7" />

                    {/* Lane divider */}
                    <line x1="12" y1="29" x2="88" y2="29" stroke="#1E1E22" strokeWidth="0.4" />

                    {/* Track 2 — Bass (cyan) */}
                    <rect x="12" y="29.5" width="14" height="9" fill="#141417" />
                    <rect x="12" y="29.5" width="0.7" height="9" fill="#22D3EE" />
                    <text x="15" y="35.3" fill="#888" fontSize="2.2" fontFamily="monospace">808</text>
                    <rect x="26" y="29.5" width="62" height="9" fill="#0F0F12" />
                    {/* Bass clips — long sustained notes */}
                    <rect x="27" y="31" width="16" height="6" rx="0.8" fill="#22D3EE" opacity="0.55" />
                    <rect x="45" y="31" width="12" height="6" rx="0.8" fill="#22D3EE" opacity="0.65" />
                    <rect x="60" y="31" width="20" height="6" rx="0.8" fill="#22D3EE" opacity="0.50" />
                    {/* Sub waveform */}
                    <path d="M28,34 q2,-2 4,0 q2,2 4,0 q2,-2 4,0 q2,2 4,0" fill="none" stroke="#67E8F9" strokeWidth="0.5" opacity="0.6" />

                    {/* Lane divider */}
                    <line x1="12" y1="38.5" x2="88" y2="38.5" stroke="#1E1E22" strokeWidth="0.4" />

                    {/* Track 3 — Melody / Synth (purple/pink) */}
                    <rect x="12" y="39" width="14" height="9" fill="#141417" />
                    <rect x="12" y="39" width="0.7" height="9" fill="#C084FC" />
                    <text x="15" y="44.8" fill="#888" fontSize="2.2" fontFamily="monospace">SYNTH</text>
                    <rect x="26" y="39" width="62" height="9" fill="#111114" />
                    {/* Synth clips — melodic phrases */}
                    <rect x="30" y="40.5" width="22" height="6" rx="0.8" fill="#C084FC" opacity="0.55" />
                    <rect x="54" y="40.5" width="18" height="6" rx="0.8" fill="#C084FC" opacity="0.65" />
                    <rect x="74" y="40.5" width="10" height="6" rx="0.8" fill="#C084FC" opacity="0.50" />
                    {/* MIDI note blocks inside */}
                    <rect x="31" y="41" width="3" height="1.2" rx="0.3" fill="#D8B4FE" opacity="0.7" />
                    <rect x="35" y="42.5" width="4" height="1.2" rx="0.3" fill="#D8B4FE" opacity="0.6" />
                    <rect x="40" y="41.8" width="2.5" height="1.2" rx="0.3" fill="#D8B4FE" opacity="0.7" />
                    <rect x="44" y="43" width="5" height="1.2" rx="0.3" fill="#D8B4FE" opacity="0.5" />
                    <rect x="55" y="41.5" width="3.5" height="1.2" rx="0.3" fill="#D8B4FE" opacity="0.7" />
                    <rect x="60" y="43" width="4" height="1.2" rx="0.3" fill="#D8B4FE" opacity="0.6" />
                    <rect x="66" y="42" width="3" height="1.2" rx="0.3" fill="#D8B4FE" opacity="0.65" />

                    {/* Lane divider */}
                    <line x1="12" y1="48" x2="88" y2="48" stroke="#1E1E22" strokeWidth="0.4" />

                    {/* Track 4 — Vox (hot pink) */}
                    <rect x="12" y="48.5" width="14" height="9" fill="#141417" />
                    <rect x="12" y="48.5" width="0.7" height="9" fill="#F472B6" />
                    <text x="15" y="54.3" fill="#888" fontSize="2.2" fontFamily="monospace">VOX</text>
                    <rect x="26" y="48.5" width="62" height="9" fill="#0F0F12" />
                    {/* Vocal clips — chopped phrases */}
                    <rect x="27" y="50" width="8" height="6" rx="0.8" fill="#F472B6" opacity="0.60" />
                    <rect x="37" y="50" width="5" height="6" rx="0.8" fill="#F472B6" opacity="0.50" />
                    <rect x="44" y="50" width="12" height="6" rx="0.8" fill="#F472B6" opacity="0.65" />
                    <rect x="58" y="50" width="7" height="6" rx="0.8" fill="#F472B6" opacity="0.55" />
                    <rect x="68" y="50" width="14" height="6" rx="0.8" fill="#F472B6" opacity="0.60" />
                    {/* Vocal waveform */}
                    <path d="M45,53 l1,-1.5 l0.5,2.5 l1,-2 l0.5,1.5 l1,-1 l0.5,2 l1,-2.5 l0.5,1.8 l1,-1 l0.5,1.5 l1,-2" fill="none" stroke="#FBCFE8" strokeWidth="0.4" opacity="0.7" />

                    {/* Lane divider */}
                    <line x1="12" y1="57.5" x2="88" y2="57.5" stroke="#1E1E22" strokeWidth="0.4" />

                    {/* Track 5 — FX / Perc (green) */}
                    <rect x="12" y="58" width="14" height="9" fill="#141417" />
                    <rect x="12" y="58" width="0.7" height="9" fill="#4ADE80" />
                    <text x="15" y="63.8" fill="#888" fontSize="2.2" fontFamily="monospace">PERC</text>
                    <rect x="26" y="58" width="62" height="9" fill="#111114" />
                    {/* Perc hits — short staccato */}
                    <rect x="28" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.55" />
                    <rect x="34" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.50" />
                    <rect x="40" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.60" />
                    <rect x="46" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.55" />
                    <rect x="52" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.50" />
                    <rect x="58" y="59.5" width="6" height="6" rx="0.8" fill="#4ADE80" opacity="0.60" />
                    <rect x="67" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.55" />
                    <rect x="73" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.45" />
                    <rect x="79" y="59.5" width="3" height="6" rx="0.8" fill="#4ADE80" opacity="0.55" />

                    {/* Lane divider */}
                    <line x1="12" y1="67" x2="88" y2="67" stroke="#1E1E22" strokeWidth="0.4" />

                    {/* Track 6 — Master (gold) */}
                    <rect x="12" y="67.5" width="14" height="9" fill="#141417" />
                    <rect x="12" y="67.5" width="0.7" height="9" fill="#FBBF24" />
                    <text x="15" y="73.3" fill="#888" fontSize="2.2" fontFamily="monospace">MSTR</text>
                    <rect x="26" y="67.5" width="62" height="9" fill="#0F0F12" />
                    {/* Master — full waveform render */}
                    <rect x="27" y="69" width="53" height="6" rx="0.8" fill="#FBBF24" opacity="0.30" />
                    <path d="M28,72 l1,-1.8 l1,2.8 l1,-2.2 l1,1.5 l1,-1.8 l1,2.5 l1,-2 l1,1.8 l1,-1.2 l1,2 l1,-2.5 l1,1.5 l1,-1 l1,2.2 l1,-2.8 l1,1.8 l1,-1.5 l1,2 l1,-2.2 l1,1.5 l1,-1.8 l1,2.5 l1,-2 l1,1.8 l1,-1.2" fill="none" stroke="#FDE68A" strokeWidth="0.6" opacity="0.8" />

                    {/* Track sidebar divider */}
                    <line x1="26" y1="20" x2="26" y2="77" stroke="#1E1E22" strokeWidth="0.5" />

                    {/* Playhead — bright vertical line */}
                    <line x1="62" y1="19" x2="62" y2="77" stroke="#FFFFFF" strokeWidth="0.6" opacity="0.9" />
                    <polygon points="60.5,19 63.5,19 62,20.5" fill="#FFFFFF" opacity="0.9" />

                    {/* Bottom mixer strip hints */}
                    <rect x="12" y="78" width="76" height="16" fill="#0E0E11" />
                    {/* Level meters */}
                    <rect x="17" y="80" width="2" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="17" y="85" width="2" height="7" rx="0.5" fill="#4ADE80" opacity="0.7" />
                    <rect x="21" y="80" width="2" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="21" y="86" width="2" height="6" rx="0.5" fill="#4ADE80" opacity="0.6" />

                    <rect x="28" y="80" width="2" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="28" y="83" width="2" height="9" rx="0.5" fill="#22D3EE" opacity="0.6" />
                    <rect x="32" y="80" width="2" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="32" y="84" width="2" height="8" rx="0.5" fill="#22D3EE" opacity="0.5" />

                    <rect x="39" y="80" width="2" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="39" y="86" width="2" height="6" rx="0.5" fill="#C084FC" opacity="0.6" />

                    <rect x="46" y="80" width="2" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="46" y="84" width="2" height="8" rx="0.5" fill="#F472B6" opacity="0.6" />

                    <rect x="53" y="80" width="2" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="53" y="87" width="2" height="5" rx="0.5" fill="#4ADE80" opacity="0.5" />

                    {/* Master fader — gold, tallest */}
                    <rect x="62" y="80" width="2.5" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="62" y="81" width="2.5" height="11" rx="0.5" fill="#FBBF24" opacity="0.7" />
                    <rect x="65.5" y="80" width="2.5" height="12" rx="0.5" fill="#1A1A1E" />
                    <rect x="65.5" y="81.5" width="2.5" height="10.5" rx="0.5" fill="#FBBF24" opacity="0.6" />
                    {/* dB label */}
                    <text x="78" y="89" fill="#555" fontSize="2" fontFamily="monospace">-0.3dB</text>
                </g>

                {/* Nameplate */}
                <rect x="18" y="99" width="64" height="12" rx="2" fill="#141416" stroke="#333" strokeWidth="0.5" />
                <text x="50" y="107" textAnchor="middle" fill="#B0B0B0" fontSize="4.5" fontFamily="Inter, sans-serif" fontWeight="800" letterSpacing="0.12em">DJ JAYHOOD</text>
            </svg>
        </div>
    );
}

// ─── UNIQU3 Chart Topper Diamond Badge (Clean SVG) ──────────────────────────
function ChartTopperDiamondBadge({ size = 32 }: { size?: number }) {
    return (
        <div
            className="group-hover:scale-[1.1] transition-transform duration-300 ease-out relative flex items-center justify-center pointer-events-auto"
            style={{
                width: size * 1.5,
                height: size * 1.5,
                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8)) drop-shadow(0 0 10px rgba(168, 85, 247, 0.4))'
            }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full z-10 block" style={{ transform: 'scale(0.95)' }}>
                <defs>
                    <linearGradient id="platinumRim" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="25%" stopColor="#9CA3AF" />
                        <stop offset="50%" stopColor="#E5E7EB" />
                        <stop offset="75%" stopColor="#4B5563" />
                        <stop offset="100%" stopColor="#FFFFFF" />
                    </linearGradient>
                    <radialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#D946EF" stopOpacity="0.8" />
                        <stop offset="50%" stopColor="#9333EA" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#4C1D95" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="diamondFacet" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F3E8FF" />
                        <stop offset="50%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#581C87" />
                    </linearGradient>
                    <filter id="chartGlow">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Base Plate */}
                <circle cx="50" cy="50" r="48" fill="#0B0A10" stroke="url(#platinumRim)" strokeWidth="2" />
                <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

                {/* Purple Aura */}
                <circle cx="50" cy="50" r="35" fill="url(#purpleGlow)" />

                {/* Chart Rings */}
                <g stroke="#A855F7" strokeWidth="0.5" fill="none" opacity="0.6">
                    <circle cx="50" cy="50" r="30" strokeDasharray="2 4" />
                    <circle cx="50" cy="50" r="22" strokeDasharray="1 3" />
                    <circle cx="50" cy="50" r="14" />
                </g>

                {/* Ascending Chart Line (Vector Graph) */}
                <path d="M 25 65 L 40 55 L 55 60 L 75 35" fill="none" stroke="#E879F9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#chartGlow)" />
                <circle cx="75" cy="35" r="3" fill="#FDF4FF" filter="url(#chartGlow)" />

                {/* Center Diamond/Star */}
                <path d="M 50 15 L 54 46 L 85 50 L 54 54 L 50 85 L 46 54 L 15 50 L 46 46 Z" fill="url(#diamondFacet)" opacity="0.3" />
                <path d="M 50 25 L 52 48 L 75 50 L 52 52 L 50 75 L 48 52 L 25 50 L 48 48 Z" fill="url(#diamondFacet)" opacity="0.8" />

                {/* Diamond Highlight */}
                <path d="M 50 25 L 52 48 L 50 50 L 48 48 Z" fill="#FFFFFF" opacity="0.6" />
                <path d="M 25 50 L 48 48 L 50 50 L 48 52 Z" fill="#FFFFFF" opacity="0.4" />

                {/* Glass Dome Edge Refractions */}
                <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M 16 75 A 40 40 0 0 0 84 75" fill="none" stroke="rgba(196, 181, 253, 0.2)" strokeWidth="1" strokeLinecap="round" />
            </svg>
        </div>
    );
}

// ─── Ms. Porsh Gold Microphone (Realistic) ──────────────────────────
function GoldMicBadge({ size = 64 }: { size?: number }) {
    return (
        <div
            className="group relative flex items-center justify-center pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.15] origin-top-right z-10"
            style={{ width: size, height: size }}
        >
            <div
                className="absolute inset-0 rounded-full blur-[10px] mix-blend-screen opacity-0 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(212,168,67,0.5) 0%, transparent 70%)' }}
            />
            <img
                src="/awards/msporsh-gold-mic.png"
                alt="Golden Voice Microphone"
                className="relative z-20 w-[95%] h-[95%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] transition-all duration-500 ease-out group-hover:drop-shadow-[0_12px_24px_rgba(212,168,67,0.4)]"
            />
        </div>
    );
}

// ─── Ms. Porsh Queen Crown (Realistic) ──────────────────────────
function QueenCrownBadge({ size = 64 }: { size?: number }) {
    return (
        <div
            className="group relative flex items-center justify-center pointer-events-auto transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-[1.15] origin-top-right z-10"
            style={{ width: size, height: size }}
        >
            <div
                className="absolute inset-0 rounded-full blur-[10px] mix-blend-screen opacity-0 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.5) 0%, transparent 70%)' }}
            />
            <img
                src="/awards/msporsh-queen-crown.png"
                alt="First Lady Crown"
                className="relative z-20 w-[95%] h-[95%] object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] transition-all duration-500 ease-out group-hover:drop-shadow-[0_12px_24px_rgba(220,38,38,0.4)]"
            />
        </div>
    );
}

// ─── DJ Taj Broadcast Antenna Plaque ──────────────────────────────────────
function BroadcastAntennaPlaqueBadge({ size = 64 }: { size?: number }) {
    return (
        <div
            className="group relative flex items-center justify-center pointer-events-auto transition-transform duration-300 ease-out hover:scale-[1.35] origin-top-right z-10"
            style={{ width: size, height: size }}
        >
            <svg viewBox="0 0 100 120" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.8))' }}>
                <defs>
                    <linearGradient id="taj-blue" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0077FF" />
                        <stop offset="100%" stopColor="#00FFFF" />
                    </linearGradient>
                    <linearGradient id="taj-silver" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FFFFFF" />
                        <stop offset="50%" stopColor="#B0B0B0" />
                        <stop offset="100%" stopColor="#707070" />
                    </linearGradient>
                    <linearGradient id="taj-gold" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#FDE047" />
                        <stop offset="100%" stopColor="#B45309" />
                    </linearGradient>
                    {/* Glowing pulse effect for waves */}
                    <filter id="taj-glow" width="150%" height="150%" x="-25%" y="-25%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Subdued Glow Background (Transparent instead of a box) */}
                <circle cx="50" cy="50" r="35" fill="url(#taj-blue)" opacity="0.05" />
                <circle cx="50" cy="50" r="28" fill="none" stroke="url(#taj-blue)" strokeWidth="0.5" strokeDasharray="3 4" opacity="0.5" />

                {/* === SiriusXM Style Signal Waves === */}
                <g fill="none" stroke="url(#taj-blue)" strokeLinecap="round" filter="url(#taj-glow)" opacity="0.9">
                    {/* Arc 1 */}
                    <path d="M 28 28 A 32 32 0 0 1 72 28" strokeWidth="3" opacity="0.3" />
                    {/* Arc 2 */}
                    <path d="M 35 36 A 22 22 0 0 1 65 36" strokeWidth="3" opacity="0.6" />
                    {/* Arc 3 */}
                    <path d="M 43 44 A 10 10 0 0 1 57 44" strokeWidth="4" />
                </g>

                {/* === SATELLITE (SIRIUS XM) === */}
                <g transform="translate(0, -2)">
                    {/* Left Solar Array */}
                    <rect x="15" y="65" width="22" height="12" fill="#0A0A10" stroke="url(#taj-blue)" strokeWidth="1" rx="1" />
                    <line x1="20" y1="65" x2="20" y2="77" stroke="url(#taj-blue)" strokeWidth="0.5" opacity="0.5" />
                    <line x1="26" y1="65" x2="26" y2="77" stroke="url(#taj-blue)" strokeWidth="0.5" opacity="0.5" />
                    <line x1="32" y1="65" x2="32" y2="77" stroke="url(#taj-blue)" strokeWidth="0.5" opacity="0.5" />

                    {/* Right Solar Array */}
                    <rect x="63" y="65" width="22" height="12" fill="#0A0A10" stroke="url(#taj-blue)" strokeWidth="1" rx="1" />
                    <line x1="68" y1="65" x2="68" y2="77" stroke="url(#taj-blue)" strokeWidth="0.5" opacity="0.5" />
                    <line x1="74" y1="65" x2="74" y2="77" stroke="url(#taj-blue)" strokeWidth="0.5" opacity="0.5" />
                    <line x1="80" y1="65" x2="80" y2="77" stroke="url(#taj-blue)" strokeWidth="0.5" opacity="0.5" />

                    {/* Array Connectors */}
                    <line x1="37" y1="71" x2="43" y2="71" stroke="url(#taj-silver)" strokeWidth="2" />
                    <line x1="57" y1="71" x2="63" y2="71" stroke="url(#taj-silver)" strokeWidth="2" />

                    {/* Satellite Central Body */}
                    <polygon points="42,60 58,60 60,82 40,82" fill="url(#taj-silver)" />
                    <rect x="44" y="64" width="12" height="14" fill="#0A0C10" />

                    {/* Glowing Core */}
                    <circle cx="50" cy="71" r="3" fill="#00FFFF" filter="url(#taj-glow)" opacity="0.8" />

                    {/* Satellite Dish pointing up */}
                    <path d="M 36 55 Q 50 40 64 55 Q 50 60 36 55" fill="url(#taj-gold)" />
                    <path d="M 46 47 L 50 55 L 54 47" fill="none" stroke="#333" strokeWidth="1" />
                    <circle cx="50" cy="47" r="1.5" fill="#FFF" filter="url(#taj-glow)" />
                </g>

                {/* Star Accent (Sirius Star) */}
                <path d="M 50 20 L 52 26 L 58 28 L 52 30 L 50 36 L 48 30 L 42 28 L 48 26 Z" fill="#FFF" filter="url(#taj-glow)" />

                {/* Floating particles/stars to compliment the transparent space theme */}
                <circle cx="20" cy="25" r="0.6" fill="#FFF" opacity="0.6" />
                <circle cx="85" cy="40" r="0.8" fill="#FFF" opacity="0.4" />
                <circle cx="25" cy="90" r="0.5" fill="#FFF" opacity="0.5" />
                <circle cx="75" cy="15" r="1" fill="#00E5FF" opacity="0.7" filter="url(#taj-glow)" />

                {/* Station Branding */}
                <g transform="translate(50, 102)">
                    <text y="0" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontFamily="Arial, sans-serif" fontWeight="900" letterSpacing="-0.05em">SIRIUS<tspan fill="#00AAFF">XM</tspan></text>
                    <text y="10" textAnchor="middle" fill="#00E5FF" fontSize="4.5" fontFamily="Arial, sans-serif" fontWeight="800" letterSpacing="0.2em">FLY 47</text>
                </g>
            </svg>
        </div>
    );
}

const ARTIST_AWARDS: Record<string, { component: React.FC<{ size?: number }>; label: string; tooltip: string }[]> = {
    uniqu3: [
        {
            component: ChartTopperDiamondBadge,
            label: 'Chart Topper',
            tooltip: 'Diamond Global Chart Topper Award — Worldwide Club Anthem Success',
        },
    ],
    uniiqu3: [
        {
            component: ChartTopperDiamondBadge,
            label: 'Chart Topper',
            tooltip: 'Diamond Global Chart Topper Award — Worldwide Club Anthem Success',
        },
    ],
    'uniiqu3-the-club-queen': [
        {
            component: ChartTopperDiamondBadge,
            label: 'Chart Topper',
            tooltip: 'Diamond Global Chart Topper Award — Worldwide Club Anthem Success',
        },
    ],
    msporsh: [
        {
            component: QueenCrownBadge,
            label: 'First Lady',
            tooltip: 'Jersey Club Radio First Lady — Queen of Jersey Club vocals',
        },
        {
            component: GoldMicBadge,
            label: 'Golden Voice',
            tooltip: 'Jersey Club Radio Golden Voice — The vocal signature of the scene',
        },
    ],
    'ms-porsh': [
        {
            component: QueenCrownBadge,
            label: 'First Lady',
            tooltip: 'Jersey Club Radio First Lady — Queen of Jersey Club vocals',
        },
        {
            component: GoldMicBadge,
            label: 'Golden Voice',
            tooltip: 'Jersey Club Radio Golden Voice — The vocal signature of the scene',
        },
    ],
    wiztv: [
        {
            component: DirectorClapperBadge,
            label: 'Cinematic Director',
            tooltip: 'Jersey Club Radio Cinematic Director — Master of visual narratives and pacing',
        },
        {
            component: VisionaryLensBadge,
            label: 'Visionary Lens',
            tooltip: 'Jersey Club Radio Visionary Lens — First to document the culture on film',
        },
    ],
    djsliink: [
        {
            component: VinylGlobeBadge,
            label: 'Global Impact',
            tooltip: 'Jersey Club Radio Global Impact — Taking the genre worldwide',
        },
    ],
    djjayhood: [
        {
            component: DAWTrackPlaqueBadge,
            label: 'The Architect',
            tooltip: 'DJ Jayhood — The Architect of Jersey Club Production',
        },
    ],
    'dj-jayhood': [
        {
            component: DAWTrackPlaqueBadge,
            label: 'The Architect',
            tooltip: 'DJ Jayhood — The Architect of Jersey Club Production',
        },
    ],
    jayhood: [
        {
            component: DAWTrackPlaqueBadge,
            label: 'The Architect',
            tooltip: 'DJ Jayhood — The Architect of Jersey Club Production',
        },
    ],
    djtaj: [
        {
            component: BroadcastAntennaPlaqueBadge,
            label: 'The Signal',
            tooltip: 'DJ Taj — Broadcasting Jersey Club to the World',
        },
    ],
    'dj-taj': [
        {
            component: BroadcastAntennaPlaqueBadge,
            label: 'The Signal',
            tooltip: 'DJ Taj — Broadcasting Jersey Club to the World',
        },
    ],
    taj: [
        {
            component: BroadcastAntennaPlaqueBadge,
            label: 'The Signal',
            tooltip: 'DJ Taj — Broadcasting Jersey Club to the World',
        },
    ],
};

export function ArtistDetail() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [artist, setArtist] = useState<ArtistDetailData | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [shared, setShared] = useState(false);
    const [zoomedAward, setZoomedAward] = useState<{ src: string; label: string } | null>(null);

    // Player & Crate Contexts
    const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
    const crateCtx = useCrateSafe();
    const addToCrate = crateCtx?.addToCrate;
    const removeFromCrate = crateCtx?.removeFromCrate;
    const isInCrate = crateCtx?.isInCrate ?? (() => false);
    const addingIds = crateCtx?.addingIds ?? new Set<string>();
    const is24k = crateCtx?.is24k ?? false;
    const openPaywall = crateCtx?.openPaywall ?? (() => { });
    const isGuestAtLimit = crateCtx?.isGuestAtLimit ?? false;

    useEffect(() => {
        if (!slug) return;
        fetch(`${BASE}/artists/${slug}`, { headers: { Authorization: `Bearer ${publicAnonKey}` } })
            .then(r => {
                if (!r.ok) { setNotFound(true); setLoading(false); return null; }
                return r.json();
            })
            .then(data => {
                if (data) setArtist(data);
                setLoading(false);
            })
            .catch(() => { setNotFound(true); setLoading(false); });
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="w-6 h-6 text-[#9D00FF] animate-spin" />
            </div>
        );
    }

    if (notFound || !artist) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 px-4">
                <Music className="w-12 h-12 text-[#1E1438]" />
                <p className="text-[#5B4F70] text-sm">Artist not found</p>
                <button
                    onClick={() => navigate('/artists')}
                    className="text-[#9D7FFF] text-xs hover:text-white transition-colors flex items-center gap-1"
                >
                    <ArrowLeft className="w-3 h-3" /> Back to roster
                </button>
            </div>
        );
    }

    const mainBadge = artist.badge ? BADGE_CONFIG[artist.badge] : null;
    const badgesToRender = [];
    if (artist.slug === 'wiztv') {
        badgesToRender.push(BADGE_CONFIG['pioneer']);
    } else if (artist.badge) {
        badgesToRender.push(BADGE_CONFIG[artist.badge]);
    }

    const socials = Object.entries(artist.socials || {}).filter(([, v]) => v);
    const awards = slug ? (ARTIST_AWARDS[slug] ?? []) : [];

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: artist.name, text: `${artist.name} — ${artist.role}`, url });
            } else {
                await navigator.clipboard.writeText(url);
                setShared(true);
                setTimeout(() => setShared(false), 2000);
            }
        } catch { /* dismissed */ }
    };

    return (
        <div className="flex flex-col gap-6 px-4 py-6 pb-32 max-w-3xl mx-auto">
            {/* Back button */}
            <motion.button
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => navigate('/artists')}
                className="flex items-center gap-1.5 text-[#5B4F70] hover:text-white transition-colors text-xs self-start"
            >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="font-bold tracking-wider uppercase">Back to Roster</span>
            </motion.button>

            {/* Hero section */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="relative rounded-2xl overflow-hidden"
                style={{
                    background: 'rgba(10, 7, 22, 0.85)',
                    border: `1px solid ${mainBadge ? `${mainBadge.color}40` : 'rgba(110,50,190,0.15)'}`,
                    boxShadow: mainBadge ? `0 0 40px ${mainBadge.glow}` : '0 4px 40px rgba(0,0,0,0.4)',
                }}
            >
                <div className="flex flex-col md:flex-row">
                    {/* Photo */}
                    <div className="relative w-full md:w-[280px] aspect-square md:aspect-auto flex-shrink-0">
                        {artist.photoUrl ? (
                            <img
                                src={artist.photoUrl}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full flex items-center justify-center min-h-[280px]"
                                style={{ background: 'linear-gradient(135deg, #0A0716, #1A0A30)' }}
                            >
                                <span className="text-7xl font-black text-[#1E1438] select-none">
                                    {artist.name.charAt(0)}
                                </span>
                            </div>
                        )}

                        {/* Photo gradient overlay */}
                        <div
                            className="absolute inset-0 pointer-events-none md:hidden"
                            style={{
                                background: 'linear-gradient(to top, rgba(10,7,22,1) 0%, transparent 50%)',
                            }}
                        />
                        <div
                            className="absolute inset-0 pointer-events-none hidden md:block"
                            style={{
                                background: 'linear-gradient(to right, transparent 50%, rgba(10,7,22,1) 100%)',
                            }}
                        />
                    </div>

                    {/* Info */}
                    <div className="relative flex-1 p-6 flex flex-col gap-4 -mt-12 md:mt-0">

                        {/* Title Bar: Badge + Awards */}
                        <div className="flex items-center justify-between">
                            {/* Badges */}
                            <div className="flex items-center gap-2">
                                {badgesToRender.map((badge, i) => {
                                    const BadgeIcon = badge.icon;
                                    return (
                                        <div
                                            key={i}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                                            style={{
                                                background: badge.bg,
                                                border: `1px solid ${badge.color}40`,
                                                boxShadow: `0 0 16px ${badge.glow}`,
                                            }}
                                        >
                                            {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" style={{ color: badge.color }} />}
                                            <span className="text-[9px] font-black tracking-[0.2em]" style={{ color: badge.color }}>
                                                {badge.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Awards Inline — click to zoom */}
                            {awards.length > 0 && (
                                <div className={`flex items-center ${['msporsh', 'ms-porsh'].includes(artist.slug || '') ? 'gap-1' : 'gap-4'}`}>
                                    {awards.map((award) => {
                                        const AwardComp = award.component;
                                        return (
                                            <div
                                                key={award.label}
                                                className="group relative cursor-pointer"
                                                title={`Click to view: ${award.label}`}
                                                onClick={(e) => {
                                                    // Find image natively—supports Ms. Porsh & Jayhood seamlessly, ignores SVGs
                                                    const img = e.currentTarget.querySelector('img');
                                                    if (img) setZoomedAward({ src: img.src, label: award.label });
                                                }}
                                            >
                                                <AwardComp size={44} />
                                                {/* Tooltip */}
                                                <div className="absolute right-[110%] top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-44 z-50">
                                                    <div className="bg-[#0A0716] border border-[#A855F7]/40 rounded-lg px-2.5 py-1.5 text-[9px] text-[#E9D5FF] font-bold tracking-wide leading-snug shadow-xl break-words whitespace-normal">
                                                        {award.tooltip}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Name & role */}
                        <div>
                            <h1 className="text-white font-black text-2xl md:text-3xl tracking-tight">
                                {artist.name}
                            </h1>
                            <p className="text-[11px] text-[#5B4F70] font-bold tracking-widest uppercase mt-1">
                                {artist.role}
                            </p>
                        </div>

                        {/* Bio */}
                        {artist.bio && (
                            <p className="text-[#8B7FA0] text-sm leading-relaxed">
                                {artist.bio}
                            </p>
                        )}

                        {/* Share + Social links */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                            {/* Share button */}
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.03]"
                                style={{
                                    background: shared ? 'rgba(0,255,136,0.08)' : 'rgba(255,255,255,0.04)',
                                    border: shared ? '1px solid rgba(0,255,136,0.4)' : '1px solid rgba(110,50,190,0.2)',
                                    color: shared ? '#00FF88' : '#9D7FFF',
                                }}
                            >
                                {shared ? <Check className="w-[18px] h-[18px]" /> : <Share2 className="w-[18px] h-[18px]" />}
                                {shared ? 'Copied!' : 'Share'}
                            </button>
                        </div>

                        {socials.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {socials.map(([platform, handle]) => {
                                    const Icon = SOCIAL_ICONS[platform];
                                    const getUrl = SOCIAL_URLS[platform];
                                    const label = SOCIAL_LABELS[platform] || platform;
                                    if (!Icon || !getUrl || !handle) return null;
                                    return (
                                        <a
                                            key={platform}
                                            href={getUrl(handle)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all duration-300 hover:scale-[1.03]"
                                            style={{
                                                background: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(110,50,190,0.15)',
                                                color: '#5B4F70',
                                            }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.color = '#9D7FFF';
                                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(157,0,255,0.4)';
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.color = '#5B4F70';
                                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(110,50,190,0.15)';
                                            }}
                                        >
                                            <Icon />
                                            {label}
                                        </a>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Badge Zoom Lightbox */}
            {zoomedAward && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
                    onClick={() => setZoomedAward(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative flex flex-col items-center gap-4 p-4"
                        onClick={e => e.stopPropagation()}
                    >
                        <img
                            src={zoomedAward.src}
                            alt={zoomedAward.label}
                            className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_12px_40px_rgba(212,168,67,0.4)]"
                        />
                        <p className="text-white/80 text-xs font-bold tracking-widest uppercase">{zoomedAward.label}</p>
                        <button
                            onClick={() => setZoomedAward(null)}
                            className="mt-2 text-[10px] text-[#9D7FFF] font-bold tracking-wider uppercase hover:text-white transition-colors"
                        >
                            Close
                        </button>
                    </motion.div>
                </div>
            )}

            {/* Tracks by this artist */}
            {artist.tracks && artist.tracks.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-4 flex items-center gap-2">
                        <Music className="w-3.5 h-3.5" />
                        Tracks on the Station ({artist.tracks.length})
                    </h2>

                    <div className="flex flex-col gap-2">
                        {artist.tracks.map((track, i) => {
                            const trackAsPlayable: Track = {
                                id: { videoId: track.videoId },
                                snippet: { title: track.title, channelTitle: track.channelTitle, publishedAt: '', description: '', thumbnails: { default: { url: track.thumbnail }, medium: { url: track.thumbnail }, high: { url: track.thumbnail } } },
                                source: track.source,
                                soundcloudUrl: track.soundcloudUrl,
                                coverArtUrl: track.coverArtUrl || track.thumbnail,
                            };

                            const isActive = currentTrack?.id.videoId === track.videoId;
                            const inCrate = isInCrate(track.videoId);
                            const isAdding = addingIds.has(track.videoId);

                            const handlePlay = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (isActive) {
                                    togglePlay();
                                } else {
                                    const playableList = artist.tracks.map(t => ({
                                        id: { videoId: t.videoId },
                                        snippet: { title: t.title, channelTitle: t.channelTitle, publishedAt: '', description: '', thumbnails: { default: { url: t.thumbnail }, medium: { url: t.thumbnail }, high: { url: t.thumbnail } } },
                                        source: t.source,
                                        soundcloudUrl: t.soundcloudUrl,
                                        coverArtUrl: t.coverArtUrl || t.thumbnail,
                                    }));
                                    playTrack(trackAsPlayable, playableList);
                                }
                            };

                            const handleCrate = (e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (inCrate) {
                                    removeFromCrate?.(track.videoId);
                                } else if (!is24k && isGuestAtLimit) {
                                    openPaywall();
                                } else {
                                    addToCrate?.(trackAsPlayable);
                                }
                            };

                            return (
                                <motion.div
                                    key={track.videoId}
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.04 }}
                                    onClick={handlePlay}
                                    className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 group cursor-pointer ${isActive ? 'bg-[#1a003a] border-[#9D00FF]/60' : ''}`}
                                    style={{
                                        background: isActive ? '#1a003a' : 'rgba(10, 7, 22, 0.6)',
                                        border: `1px solid ${isActive ? 'rgba(157,0,255,0.6)' : 'rgba(110,50,190,0.08)'}`,
                                    }}
                                    onMouseEnter={e => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.background = 'rgba(10, 7, 22, 0.9)';
                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(157,0,255,0.2)';
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!isActive) {
                                            (e.currentTarget as HTMLElement).style.background = 'rgba(10, 7, 22, 0.6)';
                                            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(110,50,190,0.08)';
                                        }
                                    }}
                                >
                                    {/* Track art */}
                                    <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                                        <img
                                            src="/jc-club-logo-white.png"
                                            alt=""
                                            className="w-full h-full object-contain p-1.5"
                                            loading="lazy"
                                        />
                                        <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                            {isActive && isPlaying ? (
                                                <Pause className="w-4 h-4 text-white" fill="white" />
                                            ) : (
                                                <Play className="w-4 h-4 text-white" fill="white" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Track info */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-bold truncate ${isActive ? 'text-[#9D00FF]' : 'text-white'}`}>
                                            {formatTrackTitle(track.title, track.channelTitle)}
                                        </p>
                                    </div>

                                    {/* Crate button */}
                                    <button
                                        onClick={handleCrate}
                                        title={inCrate ? 'Remove from crate' : 'Save to crate'}
                                        className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                                        style={{ background: inCrate ? (is24k ? 'rgba(191,149,63,0.15)' : 'rgba(157,0,255,0.15)') : 'transparent' }}
                                    >
                                        <GoldVinylRecord
                                            is24k={inCrate || is24k}
                                            size={26}
                                            spinning={isAdding}
                                        />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* Jayhood Special Career Highlights */}
            {artist.slug === 'djjayhood' && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-[rgba(10,7,22,0.85)] border border-[rgba(110,50,190,0.15)] rounded-2xl p-6 mt-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(157,0,255,0.05), transparent)' }} />

                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-5 flex items-center gap-2 relative z-10">
                        <Check className="w-4 h-4" />
                        Key Career Highlights
                    </h2>

                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Production & Remixes:</strong> He is famous for his remixes of dance classics like "Show Me Love" and "Heartbroken," which have garnered millions of plays.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Industry Collaborations:</strong> Beyond the club scene, he has produced for major artists such as Missy Elliott and Sharaya J.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Signature Tracks:</strong> His original productions like "Jersey Anthem," "Hands on Ya Hips," and "Patty Cake" are considered all-time classics within the Jersey Club community.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Major Releases:</strong> In 2017, the label Local Action released KING, a compilation of his greatest hits and previously unreleased archive tracks.
                            </p>
                        </li>
                    </ul>
                </motion.div>
            )}

            {/* Sliink Special Career Highlights */}
            {artist.slug === 'djsliink' && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-[rgba(10,7,22,0.85)] border border-[rgba(110,50,190,0.15)] rounded-2xl p-6 mt-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(157,0,255,0.05), transparent)' }} />

                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-5 flex items-center gap-2 relative z-10">
                        <Check className="w-4 h-4" />
                        Career Highlights
                    </h2>

                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Genre Pioneer:</strong> He is credited with leading the musical movement that brought Jersey Club to mainstream attention through platforms like Pitchfork, Billboard, and The Fader.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Label Affiliations:</strong> Sliink has released music through major electronic labels including Skrillex's OWSLA, Flosstradamus's Fool's Gold, and Body High.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Notable Collaborations:</strong> His work includes collaborations and high-profile remixes for artists such as Chris Brown, The Dream, Skrillex, and Flosstradamus.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Fashion & Culture:</strong> He has soundtracked runways for designers Alexander Wang and Rick Owens and performed at major global festivals.
                            </p>
                        </li>
                    </ul>
                </motion.div>
            )}

            {/* UNIIQU3 Career & Style Highlights */}
            {(artist.slug === 'uniqu3' || artist.slug === 'uniiqu3' || artist.slug === 'uniiqu3-the-club-queen') && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-[rgba(10,7,22,0.85)] border border-[rgba(110,50,190,0.15)] rounded-2xl p-6 mt-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(157,0,255,0.05), transparent)' }} />

                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-5 flex items-center gap-2 relative z-10">
                        <Sparkles className="w-4 h-4" />
                        Career & Style
                    </h2>

                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Genre Influence:</strong> Her music is an "ecstatic blend" of Jersey club, ballroom, juke, trap, and R&B. She is known for her "sex-positive" lyrics and "high-octane" DJ sets.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Notable Works:</strong> She gained major attention for her 2018 track "Girls Off the Chain" (with TT the Artist), which was notably sampled in Chloe Bailey's debut single "Have Mercy".
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Media Presence:</strong> UNIIQU3 hosts Club Queen Radio on SiriusXM and the biweekly Club Chronicles.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Albums/EPs:</strong> Phase 3 (2018), Heartbeats (2021), and the Ramen Noodles EP (2024).
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Popular Singles:</strong> "Microdosing," "2 The Floor," "Breakin' Necks," and "Price Going Up".
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Collaborations:</strong> She has worked with artists like Big Freedia, Moore Kismet, and Whipped Cream, and has produced official remixes for stars like Tiwa Savage and Crystal Waters.
                            </p>
                        </li>
                    </ul>
                </motion.div>
            )}

            {/* WizTV Entertainment & Media */}
            {artist.slug === 'wiztv' && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-[rgba(10,7,22,0.85)] border border-[rgba(110,50,190,0.15)] rounded-2xl p-6 mt-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(157,0,255,0.05), transparent)' }} />

                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-5 flex items-center gap-2 relative z-10">
                        <Check className="w-4 h-4" />
                        Entertainment & Media
                    </h2>

                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Wiztv (Videographer/DJ):</strong> A popular media personality from Jersey City, NJ and content creator known for documenting the Jersey Club music scene, Jersey City DJ Documentary and Classic Blend Mixtapes.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Content Platforms:</strong> He operates a YouTube channel and a Patreon where he shares documentaries and party footage.
                            </p>
                        </li>
                    </ul>
                </motion.div>
            )}

            {/* Ms. Porsh Career Highlights */}
            {(artist.slug === 'msporsh' || artist.slug === 'ms-porsh') && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-[rgba(10,7,22,0.85)] border border-[rgba(110,50,190,0.15)] rounded-2xl p-6 mt-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(157,0,255,0.05), transparent)' }} />

                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-5 flex items-center gap-2 relative z-10">
                        <Check className="w-4 h-4" />
                        Key Career Highlights
                    </h2>

                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Viral Hits:</strong> She rose to prominence with iconic club tracks such as "Sexy Walk" and "Rock My Hips," which remain staples in the genre.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Recent Releases:</strong> In 2022, she released the EP It's Ms Porsh! featuring the popular single "Magic City".
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Legacy:</strong> After a brief hiatus, she made a highly publicized return to the scene in 2024, reaffirming her status as a New Jersey legend.
                            </p>
                        </li>
                    </ul>
                </motion.div>
            )}

            {/* DJ Lilman Career Highlights */}
            {(artist.slug === 'djlilman973' || artist.slug === 'djlilman') && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-[rgba(10,7,22,0.85)] border border-[rgba(110,50,190,0.15)] rounded-2xl p-6 mt-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(157,0,255,0.05), transparent)' }} />

                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-5 flex items-center gap-2 relative z-10">
                        <Check className="w-4 h-4" />
                        Musical Career and Impact
                    </h2>

                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Signature Sound:</strong> He is famous for "Team Lilman" anthems and tracks that incorporate call-and-response instructions for specific dance moves.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Top Tracks:</strong> "Team Lilman Anthem", "Sexy Walk" (feat. Ms Porsh), "I Like the Way She Move" (feat. 40 Cal), and "Stop Playing with Me".
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Collaborations:</strong> He has worked with industry figures such as DJ Envy, Funkmaster Flex, and Joe Budden. Recent content has also featured high-profile personalities like Kai Cenat and Kyrie Irving.
                            </p>
                        </li>
                    </ul>
                </motion.div>
            )}

            {/* DJ Taj Music and Career */}
            {(artist.slug === 'djtaj' || artist.slug === 'dj-taj' || artist.slug === 'taj') && (
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-[rgba(10,7,22,0.85)] border border-[rgba(110,50,190,0.15)] rounded-2xl p-6 mt-4 relative overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to bottom right, rgba(157,0,255,0.05), transparent)' }} />

                    <h2 className="text-xs font-black text-[#9D7FFF] tracking-widest uppercase mb-5 flex items-center gap-2 relative z-10">
                        <Check className="w-4 h-4" />
                        Music and Career
                    </h2>

                    <ul className="space-y-4 relative z-10">
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Jersey Club Influence:</strong> He specializes in Jersey Club remixes of popular hits, characterized by fast-paced tempos and heavy bass.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Viral Hits:</strong> His tracks like the "BBE Challenge", "Caillou Anthem", and his remix of "Poledancer" (feat. Megan Thee Stallion) have garnered millions of views and listens.
                            </p>
                        </li>
                        <li className="flex items-start gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#9D00FF] mt-2 flex-shrink-0 shadow-[0_0_8px_#9D00FF]" />
                            <p className="text-[13px] leading-relaxed text-[#ABA0C0]">
                                <strong className="text-white tracking-wide">Recent Work:</strong> In early 2026, he released several new tracks including "Pop Dat Thang" and "Chanel", alongside his "Jersey Club Spring Mix 2025".
                            </p>
                        </li>
                    </ul>
                </motion.div>
            )}
        </div>
    );
}
