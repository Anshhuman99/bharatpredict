import { ImageResponse } from 'next/og';

export const alt = 'BharatPredict Social Card';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050';
const API_URL = BASE_URL.endsWith('/api/v1') ? BASE_URL : `${BASE_URL}/api/v1`;

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const marketId = resolvedParams.id;
  
  let title = 'Predict and Trade India\'s Future';
  let category = 'CONSENSUS';
  let yesPrice = '₹5.0';
  let noPrice = '₹5.0';
  let volume = '₹0';
  
  try {
    const res = await fetch(`${API_URL}/markets/${marketId}`, {
      next: { revalidate: 60 }
    });
    if (res.ok) {
      const data = await res.json();
      title = data.title || title;
      category = data.category || category;
      yesPrice = `₹${(data.yesPrice || 0.5).toFixed(2)}`;
      noPrice = `₹${(data.noPrice || 0.5).toFixed(2)}`;
      volume = `₹${(data.volume || 0).toLocaleString('en-IN')}`;
    }
  } catch (e) {
    console.error('Failed to fetch market details for OG image:', e);
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: 'radial-gradient(circle at 10% 20%, #121620 0%, #0b0e14 90%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          border: '4px solid #1e2530',
        }}
      >
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              background: 'linear-gradient(to right, #3b82f6, #4f46e5)',
              borderRadius: '16px',
              width: '60px',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              marginRight: '20px',
            }}
          >
            🇮🇳
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', letterSpacing: '1px' }}>
              BharatPredict
            </span>
            <span style={{ fontSize: '14px', color: '#828fbf', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px' }}>
              Trade India's Future
            </span>
          </div>
        </div>

        {/* Market Title and Category */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', margin: '40px 0' }}>
          <span
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: '#3b82f6',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              alignSelf: 'flex-start',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '16px',
            }}
          >
            {category}
          </span>
          <span style={{ fontSize: '42px', fontWeight: '900', lineHeight: '1.2', color: '#ffffff' }}>
            {title}
          </span>
        </div>

        {/* Pricing & Volume Info */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '40px' }}>
          <div style={{ display: 'flex', gap: '40px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#828fbf', textTransform: 'uppercase', fontWeight: 'bold' }}>YES Price</span>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#00c853', marginTop: '6px' }}>{yesPrice}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '14px', color: '#828fbf', textTransform: 'uppercase', fontWeight: 'bold' }}>NO Price</span>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff3d00', marginTop: '6px' }}>{noPrice}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '14px', color: '#828fbf', textTransform: 'uppercase', fontWeight: 'bold' }}>Lobby Vol.</span>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffffff', marginTop: '6px' }}>{volume}</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
