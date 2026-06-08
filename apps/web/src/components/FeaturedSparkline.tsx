'use client';

import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface FeaturedSparklineProps {
  data: { value: number }[];
}

export default function FeaturedSparkline({ data }: FeaturedSparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00c853" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#00c853" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke="#00c853"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#sparklineGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
