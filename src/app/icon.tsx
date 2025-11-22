import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export function generateImageMetadata() {
  return [
    {
      contentType: 'image/png',
      size: { width: 16, height: 16 },
      id: '16',
    },
    {
      contentType: 'image/png',
      size: { width: 32, height: 32 },
      id: '32',
    },
    {
      contentType: 'image/png',
      size: { width: 48, height: 48 },
      id: '48',
    },
  ]
}

export default function Icon({ id }: { id: string }) {
  const size = parseInt(id)
  // Adjust icon size relative to container
  const iconSize = Math.max(10, Math.floor(size * 0.7))
  const strokeWidth = size <= 16 ? 3 : 2

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
          color: '#0ea5e9',
          borderRadius: size <= 16 ? '2px' : '20%',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10l3 3z" />
          <path d="m16 16 6-6" />
          <path d="m8 8 6-6" />
          <path d="m9 7 8 8" />
          <path d="m21 11-8-8" />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
    }
  )
}
